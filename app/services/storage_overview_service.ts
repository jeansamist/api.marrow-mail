import FileRepository from '#repositories/file_repository'
import MailAccountRepository from '#repositories/mail_account_repository'
import PaymentRepository from '#repositories/payment_repository'
import SubscriptionRepository from '#repositories/subscription_repository'
import { ElgiopayService } from '#services/elgiopay_service'
import { GeoService } from '#services/geo_service'
import { StripeService } from '#services/stripe_service'
import { SubscriptionService } from '#services/subscription_service'
import env from '#start/env'
import { resolveCurrencyForCountry } from '#utils/currency_for_country'
import { defaultStorageBytesForPlan, STORAGE_PRICE_PER_GB_XAF, type PlanId } from '#utils/pricing'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

const BYTES_PER_GB = 1024 * 1024 * 1024

interface StorageAddonMetadata {
  type: 'storage_addon'
  mailAccountId: number
  extraGB: number
}

interface StorageAddonCheckoutPayload {
  mailAccountId: number
  extraGB: number
  paymentMethod: 'card' | 'mtn_mobile_money' | 'orange_money'
  customerPhone?: string
}

type StorageAddonCheckoutResult =
  | { paymentId: number; providerPayload: { clientSecret: string | null } }
  | { paymentId: number; providerPayload: { transactionId: string } }

@inject()
export class StorageOverviewService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly mailAccountRepository: MailAccountRepository,
    private readonly subscriptionService: SubscriptionService,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly stripeService: StripeService,
    private readonly elgiopayService: ElgiopayService,
    private readonly geoService: GeoService,
    private readonly ctx: HttpContext
  ) {}

  private get userId() {
    return this.ctx.auth.user!.id
  }

  private async defaultQuotaBytes(): Promise<number> {
    const subscription = await this.subscriptionService.getCurrentForUser()
    return defaultStorageBytesForPlan((subscription?.planId as PlanId) ?? 'core')
  }

  async getUsageForCurrentUser() {
    const [mailAccounts, defaultQuotaBytes] = await Promise.all([
      this.mailAccountRepository.findAllByUserId(this.userId),
      this.defaultQuotaBytes(),
    ])
    const usageByAccount = await this.fileRepository.sumSizeByMailAccountIds(
      mailAccounts.map((account) => account.id)
    )

    const mailboxes = mailAccounts.map((account) => {
      const usedBytes = usageByAccount.get(account.id) ?? 0
      const quotaBytes = Number(account.storageQuotaBytes ?? defaultQuotaBytes)
      return {
        mailAccountId: account.id,
        username: account.username,
        usedBytes,
        quotaBytes,
      }
    })

    return {
      mailboxes,
      totalUsedBytes: mailboxes.reduce((sum, mailbox) => sum + mailbox.usedBytes, 0),
      totalQuotaBytes: mailboxes.reduce((sum, mailbox) => sum + mailbox.quotaBytes, 0),
    }
  }

  async updateQuota(mailAccountId: number, quotaBytes: number) {
    const mailAccount = await this.mailAccountRepository.findById(mailAccountId)
    if (!mailAccount) throw httpError(404, 'Mail account not found')
    if (mailAccount.userId !== this.userId) {
      throw httpError(403, 'You are not allowed to access this mail account')
    }
    return this.mailAccountRepository.update(mailAccount, { storageQuotaBytes: quotaBytes })
  }

  async assertWithinQuota(mailAccountId: number, additionalBytes: number): Promise<void> {
    const mailAccount = await this.mailAccountRepository.findById(mailAccountId)
    if (!mailAccount) throw httpError(404, 'Mail account not found')

    const usedBytes = await this.fileRepository.sumSizeByMailAccountId(mailAccountId)
    const quotaBytes = Number(
      mailAccount.storageQuotaBytes ?? (await this.defaultQuotaBytes())
    )

    if (usedBytes + additionalBytes > quotaBytes) {
      throw httpError(413, 'Storage quota exceeded')
    }
  }

  /**
   * Extra storage beyond the plan's included quota is a paid add-on — this
   * creates a real charge (Stripe PaymentIntent or an Elgiopay mobile-money
   * payment) and only grants the extra GB once that charge is confirmed
   * (see getStorageAddonPaymentStatus), never up front.
   */
  async createStorageAddonCheckout(
    data: StorageAddonCheckoutPayload,
    ip: string
  ): Promise<StorageAddonCheckoutResult> {
    if (data.extraGB <= 0) throw httpError(422, 'extraGB must be greater than zero')

    const mailAccount = await this.mailAccountRepository.findById(data.mailAccountId)
    if (!mailAccount) throw httpError(404, 'Mail account not found')
    if (mailAccount.userId !== this.userId) {
      throw httpError(403, 'You are not allowed to access this mail account')
    }

    const subscription = await this.subscriptionRepository.findLatestActiveForUser(this.userId)
    if (!subscription) {
      throw httpError(402, 'An active subscription is required to buy additional storage')
    }

    const amount = data.extraGB * STORAGE_PRICE_PER_GB_XAF
    const metadata: StorageAddonMetadata = {
      type: 'storage_addon',
      mailAccountId: data.mailAccountId,
      extraGB: data.extraGB,
    }

    if (data.paymentMethod === 'card') {
      const currency = this.stripeCurrency()
      const paymentIntent = await this.stripeService.client.paymentIntents.create({
        amount,
        currency,
        metadata: {
          userId: String(this.userId),
          mailAccountId: String(data.mailAccountId),
          extraGB: String(data.extraGB),
        },
      })

      const payment = await this.paymentRepository.create({
        subscriptionId: subscription.id,
        provider: 'stripe',
        providerTransactionId: paymentIntent.id,
        amount,
        currency: currency.toUpperCase(),
        status: 'pending',
        customerPhone: null,
        failureReason: null,
        rawResponse: metadata,
      })

      return { paymentId: payment.id, providerPayload: { clientSecret: paymentIntent.client_secret } }
    }

    if (!data.customerPhone) {
      throw httpError(422, 'customerPhone is required for mobile money payments')
    }

    const user = this.ctx.auth.user!
    const countryCode = this.geoService.resolveCountryCode(ip)
    const currency = resolveCurrencyForCountry(countryCode)

    const result = await this.elgiopayService.createPayment({
      amount,
      currency,
      payment_method: data.paymentMethod,
      customer_phone: data.customerPhone,
      customer_name: `${user.firstName} ${user.lastName}`,
      customer_email: user.email,
      reference: `storage-addon-${data.mailAccountId}-${data.extraGB}gb-${Date.now()}`,
      metadata: { ...metadata },
    })

    const payment = await this.paymentRepository.create({
      subscriptionId: subscription.id,
      provider: 'elgiopay',
      providerTransactionId: result.transaction_id,
      amount,
      currency,
      status: 'pending',
      customerPhone: data.customerPhone,
      failureReason: null,
      rawResponse: metadata,
    })

    return { paymentId: payment.id, providerPayload: { transactionId: result.transaction_id } }
  }

  /**
   * Polls the live gateway state for a pending storage-addon payment. The
   * quota bump is applied here, exactly once, on the pending -> completed
   * transition — never at checkout time.
   */
  async getStorageAddonPaymentStatus(paymentId: number): Promise<{ status: string }> {
    const payment = await this.paymentRepository.findById(paymentId)
    if (!payment) throw httpError(404, 'Payment not found')

    const subscription = await this.subscriptionRepository.findById(payment.subscriptionId)
    if (!subscription || subscription.userId !== this.userId) {
      throw httpError(403, 'You are not allowed to access this payment')
    }

    if (payment.status !== 'pending') {
      return { status: payment.status }
    }

    let succeeded = false

    if (payment.provider === 'stripe' && payment.providerTransactionId) {
      const paymentIntent = await this.stripeService.client.paymentIntents.retrieve(
        payment.providerTransactionId
      )
      if (paymentIntent.status === 'succeeded') succeeded = true
      else if (paymentIntent.status === 'canceled') {
        await this.paymentRepository.update(payment, { status: 'failed' })
        return { status: 'failed' }
      }
    } else if (payment.provider === 'elgiopay' && payment.providerTransactionId) {
      const live = await this.elgiopayService.getPayment(payment.providerTransactionId)
      if (live.status === 'completed') succeeded = true
      else if (live.status === 'failed') {
        await this.paymentRepository.update(payment, { status: 'failed' })
        return { status: 'failed' }
      }
    }

    if (!succeeded) return { status: 'pending' }

    await this.paymentRepository.update(payment, { status: 'completed' })
    await this.applyStorageAddon(payment.rawResponse as StorageAddonMetadata)

    return { status: 'completed' }
  }

  private async applyStorageAddon(metadata: StorageAddonMetadata): Promise<void> {
    const mailAccount = await this.mailAccountRepository.findById(metadata.mailAccountId)
    if (!mailAccount) return

    const currentQuotaBytes = Number(
      mailAccount.storageQuotaBytes ?? (await this.defaultQuotaBytes())
    )
    await this.mailAccountRepository.update(mailAccount, {
      storageQuotaBytes: currentQuotaBytes + metadata.extraGB * BYTES_PER_GB,
    })
  }

  private stripeCurrency(): string {
    return env.get('STRIPE_CURRENCY').toLowerCase()
  }
}
