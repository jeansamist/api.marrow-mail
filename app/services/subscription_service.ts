import Subscription from '#models/subscription'
import PaymentRepository from '#repositories/payment_repository'
import SubscriptionRepository from '#repositories/subscription_repository'
import { ElgiopayService } from '#services/elgiopay_service'
import { GeoService } from '#services/geo_service'
import { StripeService } from '#services/stripe_service'
import env from '#start/env'
import { resolveCurrencyForCountry } from '#utils/currency_for_country'
import { httpError } from '#utils/http_error'
import { calcMailboxPricing, type PlanId } from '#utils/pricing'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import type Stripe from 'stripe'

interface CheckoutPayload {
  planId: PlanId
  mailboxQuantity: number
  billingMonths: 1 | 3 | 6 | 12
  paymentMethod: 'card' | 'mtn_mobile_money' | 'orange_money'
  customerPhone?: string
}

type CheckoutResult =
  | { subscription: Subscription; providerPayload: { clientSecret: string | null } }
  | { subscription: Subscription; providerPayload: { transactionId: string } }

@inject()
export class SubscriptionService {
  constructor(
    private readonly repository: SubscriptionRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly stripeService: StripeService,
    private readonly elgiopayService: ElgiopayService,
    private readonly geoService: GeoService,
    private readonly ctx: HttpContext
  ) {}

  private get userId() {
    return this.ctx.auth.user!.id
  }

  private checkOwnership(subscription: Subscription) {
    if (subscription.userId !== this.userId) {
      throw httpError(403, 'You are not allowed to access this subscription')
    }
  }

  async checkout(data: CheckoutPayload, ip: string): Promise<CheckoutResult> {
    const user = this.ctx.auth.user!
    const pricing = calcMailboxPricing(data.mailboxQuantity, data.billingMonths, data.planId)
    const countryCode = this.geoService.resolveCountryCode(ip)

    if (data.paymentMethod === 'card') {
      return this.checkoutWithStripe(data, pricing.total, countryCode)
    }

    if (!data.customerPhone) {
      throw httpError(422, 'customerPhone is required for mobile money payments')
    }

    return this.checkoutWithElgiopay(data, pricing.total, countryCode, user)
  }

  private async checkoutWithStripe(
    data: CheckoutPayload,
    amountTotal: number,
    countryCode: string | null
  ): Promise<CheckoutResult> {
    const currency = this.stripeCurrency()

    const subscription = await this.repository.create({
      userId: this.userId,
      provider: 'stripe',
      planId: data.planId,
      mailboxQuantity: data.mailboxQuantity,
      billingMonths: data.billingMonths,
      countryCode,
      currency: currency.toUpperCase(),
      amountTotal,
      status: 'pending',
      currentPeriodEnd: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    })

    const user = this.ctx.auth.user!
    const customer = await this.stripeService.client.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: { userId: String(this.userId) },
    })

    const recurring: Stripe.PriceCreateParams.Recurring =
      data.billingMonths === 12
        ? { interval: 'year', interval_count: 1 }
        : { interval: 'month', interval_count: data.billingMonths }

    const stripeSubscription = await this.stripeService.client.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price_data: {
            currency,
            product: this.stripeProductId(data.planId),
            unit_amount: Math.round(amountTotal / data.mailboxQuantity),
            recurring,
          },
          quantity: data.mailboxQuantity,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: { userId: String(this.userId), subscriptionId: String(subscription.id) },
    })

    await this.repository.update(subscription, {
      stripeCustomerId: customer.id,
      stripeSubscriptionId: stripeSubscription.id,
    })

    const latestInvoice = stripeSubscription.latest_invoice as Stripe.Invoice & {
      payment_intent?: Stripe.PaymentIntent
    }
    const paymentIntent = latestInvoice?.payment_intent

    await this.paymentRepository.create({
      subscriptionId: subscription.id,
      provider: 'stripe',
      providerTransactionId: paymentIntent?.id ?? null,
      amount: amountTotal,
      currency: currency.toUpperCase(),
      status: 'pending',
      customerPhone: null,
      failureReason: null,
      rawResponse: null,
    })

    return {
      subscription,
      providerPayload: { clientSecret: paymentIntent?.client_secret ?? null },
    }
  }

  private async checkoutWithElgiopay(
    data: CheckoutPayload,
    amountTotal: number,
    countryCode: string | null,
    user: { firstName: string; lastName: string; email: string }
  ): Promise<CheckoutResult> {
    const currency = resolveCurrencyForCountry(countryCode)

    const subscription = await this.repository.create({
      userId: this.userId,
      provider: 'elgiopay',
      planId: data.planId,
      mailboxQuantity: data.mailboxQuantity,
      billingMonths: data.billingMonths,
      countryCode,
      currency,
      amountTotal,
      status: 'pending',
      currentPeriodEnd: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    })

    const result = await this.elgiopayService.createPayment({
      amount: amountTotal,
      currency,
      payment_method: data.paymentMethod as 'mtn_mobile_money' | 'orange_money',
      customer_phone: data.customerPhone!,
      customer_name: `${user.firstName} ${user.lastName}`,
      customer_email: user.email,
      reference: `subscription-${subscription.id}`,
      metadata: { subscriptionId: subscription.id },
    })

    await this.paymentRepository.create({
      subscriptionId: subscription.id,
      provider: 'elgiopay',
      providerTransactionId: result.transaction_id,
      amount: amountTotal,
      currency,
      status: 'pending',
      customerPhone: data.customerPhone ?? null,
      failureReason: null,
      rawResponse: null,
    })

    return { subscription, providerPayload: { transactionId: result.transaction_id } }
  }

  async getStatus(subscriptionId: number): Promise<Subscription> {
    const subscription = await this.repository.findById(subscriptionId)
    if (!subscription) throw httpError(404, 'Subscription not found')
    this.checkOwnership(subscription)

    if (subscription.status !== 'pending') {
      return subscription
    }

    if (subscription.provider === 'elgiopay') {
      const payment = await this.paymentRepository.findLatestForSubscription(subscription.id)
      if (payment?.providerTransactionId) {
        const live = await this.elgiopayService.getPayment(payment.providerTransactionId)
        await this.syncElgiopayPaymentState(subscription, live)
      }
    } else if (subscription.stripeSubscriptionId) {
      const stripeSubscription = await this.stripeService.client.subscriptions.retrieve(
        subscription.stripeSubscriptionId,
        { expand: ['latest_invoice.payment_intent'] }
      )
      await this.syncStripeSubscriptionState(subscription, stripeSubscription)
    }

    return (await this.repository.findById(subscriptionId))!
  }

  async assertActiveEntitlement(requestedTotalMailboxCount: number): Promise<void> {
    const subscriptions = await this.repository.findAllActiveForUser(this.userId)

    const validSubscriptions = subscriptions.filter((subscription) => {
      if (
        subscription.provider === 'elgiopay' &&
        subscription.currentPeriodEnd &&
        subscription.currentPeriodEnd < DateTime.now()
      ) {
        return false
      }
      return true
    })

    if (validSubscriptions.length === 0) {
      throw httpError(402, 'An active subscription is required before creating mailboxes')
    }

    const totalEntitledMailboxes = validSubscriptions.reduce(
      (total, subscription) => total + subscription.mailboxQuantity,
      0
    )

    if (requestedTotalMailboxCount > totalEntitledMailboxes) {
      throw httpError(
        402,
        'This request exceeds the mailbox quantity included in your subscription'
      )
    }
  }

  async applyStripeWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const stripeSubscriptionId =
          typeof invoice.parent?.subscription_details?.subscription === 'string'
            ? invoice.parent.subscription_details.subscription
            : null
        if (!stripeSubscriptionId) return

        const subscription = await this.repository.findByStripeSubscriptionId(stripeSubscriptionId)
        if (!subscription) return

        const rawPaymentIntent = invoice.payments?.data?.[0]?.payment.payment_intent
        const paymentIntentId =
          typeof rawPaymentIntent === 'string' ? rawPaymentIntent : (rawPaymentIntent?.id ?? null)

        const existingPayment = paymentIntentId
          ? await this.paymentRepository.findByProviderTransactionId(paymentIntentId)
          : await this.paymentRepository.findLatestForSubscription(subscription.id)

        if (event.type === 'invoice.paid') {
          if (existingPayment) {
            await this.paymentRepository.update(existingPayment, { status: 'completed' })
          }
          await this.repository.update(subscription, {
            status: 'active',
            currentPeriodEnd: this.periodEndFromInvoice(invoice, subscription.billingMonths),
          })
        } else {
          if (existingPayment) {
            await this.paymentRepository.update(existingPayment, {
              status: 'failed',
              failureReason: 'Stripe invoice payment failed',
            })
          }
          await this.repository.update(subscription, { status: 'past_due' })
        }
        return
      }
      case 'customer.subscription.updated': {
        const stripeSubscription = event.data.object as Stripe.Subscription
        const subscription = await this.repository.findByStripeSubscriptionId(stripeSubscription.id)
        if (!subscription) return
        await this.syncStripeSubscriptionState(subscription, stripeSubscription)
        return
      }
      case 'customer.subscription.deleted': {
        const stripeSubscription = event.data.object as Stripe.Subscription
        const subscription = await this.repository.findByStripeSubscriptionId(stripeSubscription.id)
        if (!subscription) return
        await this.repository.update(subscription, { status: 'canceled' })
        return
      }
      default:
        return
    }
  }

  async applyElgiopayWebhookEvent(envelope: {
    event: string
    data: { transaction_id?: string; id?: string; message?: string }
  }): Promise<void> {
    if (envelope.event !== 'payment.completed' && envelope.event !== 'payment.failed') {
      return
    }

    const transactionId = envelope.data.transaction_id ?? envelope.data.id
    if (!transactionId) return

    const payment = await this.paymentRepository.findByProviderTransactionId(transactionId)
    if (!payment) return

    const subscription = await this.repository.findById(payment.subscriptionId)
    if (!subscription) return

    if (envelope.event === 'payment.completed') {
      await this.paymentRepository.update(payment, { status: 'completed' })
      await this.repository.update(subscription, {
        status: 'active',
        currentPeriodEnd: DateTime.now().plus({ months: subscription.billingMonths }),
      })
    } else {
      await this.paymentRepository.update(payment, {
        status: 'failed',
        failureReason: envelope.data.message ?? 'Elgiopay payment failed',
      })
      await this.repository.update(subscription, { status: 'failed' })
    }
  }

  private async syncElgiopayPaymentState(
    subscription: Subscription,
    live: { status: string; transaction_id: string }
  ) {
    const payment = await this.paymentRepository.findByProviderTransactionId(live.transaction_id)

    if (live.status === 'completed') {
      if (payment) await this.paymentRepository.update(payment, { status: 'completed' })
      await this.repository.update(subscription, {
        status: 'active',
        currentPeriodEnd: DateTime.now().plus({ months: subscription.billingMonths }),
      })
    } else if (live.status === 'failed') {
      if (payment) await this.paymentRepository.update(payment, { status: 'failed' })
      await this.repository.update(subscription, { status: 'failed' })
    }
  }

  private async syncStripeSubscriptionState(
    subscription: Subscription,
    stripeSubscription: Stripe.Subscription
  ) {
    const statusMap: Record<string, string> = {
      active: 'active',
      trialing: 'active',
      past_due: 'past_due',
      unpaid: 'failed',
      incomplete_expired: 'failed',
      canceled: 'canceled',
    }
    const status = statusMap[stripeSubscription.status] ?? subscription.status
    const currentPeriodItem = stripeSubscription.items.data[0]

    await this.repository.update(subscription, {
      status,
      currentPeriodEnd: currentPeriodItem
        ? DateTime.fromSeconds(currentPeriodItem.current_period_end)
        : subscription.currentPeriodEnd,
    })
  }

  private periodEndFromInvoice(invoice: Stripe.Invoice, billingMonths: number): DateTime {
    const line = invoice.lines?.data?.[0]
    if (line?.period?.end) {
      return DateTime.fromSeconds(line.period.end)
    }
    return DateTime.now().plus({ months: billingMonths })
  }

  private stripeCurrency(): string {
    return env.get('STRIPE_CURRENCY').toLowerCase()
  }

  private stripeProductId(planId: PlanId): string {
    return planId === 'core' ? env.get('STRIPE_PRODUCT_CORE_ID') : env.get('STRIPE_PRODUCT_PLUS_ID')
  }
}
