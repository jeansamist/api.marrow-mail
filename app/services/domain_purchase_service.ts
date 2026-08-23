import DomainRepository from '#repositories/domain_repository'
import PaymentRepository from '#repositories/payment_repository'
import { type RegistrantContact, Route53DomainsService } from '#services/route53_domains_service'
import { ElgiopayService } from '#services/elgiopay_service'
import { InvoiceService } from '#services/invoice_service'
import { StripeService } from '#services/stripe_service'
import { resolveCurrencyForCountry } from '#utils/currency_for_country'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

// Curated to generic gTLDs with plain ICANN registration requirements —
// excludes ccTLDs (e.g. .africa, .us, .ca) that often carry extra
// eligibility rules Route53 would reject without fields this flow
// doesn't collect.
const SUPPORTED_TLDS = ['com', 'net', 'org', 'io', 'co', 'biz', 'info']

interface DomainPurchaseMetadata {
  type: 'domain_purchase'
  domainName: string
  registrantContact: RegistrantContact
}

interface CreatePurchaseCheckoutPayload {
  domainName: string
  paymentMethod: 'card' | 'mtn_mobile_money' | 'orange_money'
  customerPhone?: string
  registrantContact: RegistrantContact
}

type PurchaseCheckoutResult =
  | { paymentId: number; providerPayload: { clientSecret: string | null } }
  | { paymentId: number; providerPayload: { transactionId: string } }

@inject()
export class DomainPurchaseService {
  constructor(
    private readonly domainRepository: DomainRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly route53DomainsService: Route53DomainsService,
    private readonly stripeService: StripeService,
    private readonly elgiopayService: ElgiopayService,
    private readonly invoiceService: InvoiceService,
    private readonly ctx: HttpContext
  ) {}

  private get userId() {
    return this.ctx.auth.user!.id
  }

  private tldOf(domainName: string): string {
    const tld = domainName.split('.').pop()?.toLowerCase()
    if (!tld || !SUPPORTED_TLDS.includes(tld)) {
      throw httpError(422, `.${tld ?? ''} is not a supported extension for domain purchase`)
    }
    return tld
  }

  /**
   * Checks every supported TLD for a base name in a single request — the
   * frontend used to fire one request per TLD in parallel, which is fragile
   * (any single failed call silently dropped the result) for no benefit,
   * since the AWS calls underneath are just as concurrent either way.
   */
  async searchDomains(slug: string) {
    const settled = await Promise.allSettled(
      SUPPORTED_TLDS.map(async (tld) => {
        const domainName = `${slug}.${tld}`
        const [available, price] = await Promise.all([
          this.route53DomainsService.checkAvailability(domainName),
          this.route53DomainsService.getPrice(tld),
        ])
        return { domain: domainName, available, priceUsd: price.amount }
      })
    )
    // One TLD's AWS call failing shouldn't sink the whole search — return
    // whichever TLDs resolved successfully.
    return settled.filter((result) => result.status === 'fulfilled').map((result) => result.value)
  }

  async createPurchaseCheckout(
    data: CreatePurchaseCheckoutPayload
  ): Promise<PurchaseCheckoutResult> {
    const tld = this.tldOf(data.domainName)

    const existing = await this.domainRepository.findByName(data.domainName)
    if (existing) throw httpError(409, 'This domain has already been purchased or connected')

    const [available, price] = await Promise.all([
      this.route53DomainsService.checkAvailability(data.domainName),
      this.route53DomainsService.getPrice(tld),
    ])
    if (!available) throw httpError(409, 'This domain is no longer available')

    // Route53 prices are USD — charged in USD regardless of provider so the
    // amount always matches what AWS will actually bill, no FX guesswork.
    const amountCents = Math.round(price.amount * 100)
    const metadata: DomainPurchaseMetadata = {
      type: 'domain_purchase',
      domainName: data.domainName,
      registrantContact: data.registrantContact,
    }

    if (data.paymentMethod === 'card') {
      const paymentIntent = await this.stripeService.client.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        metadata: { userId: String(this.userId), domainName: data.domainName },
      })

      const payment = await this.paymentRepository.create({
        subscriptionId: null,
        provider: 'stripe',
        providerTransactionId: paymentIntent.id,
        amount: amountCents,
        currency: 'USD',
        status: 'pending',
        customerPhone: null,
        failureReason: null,
        rawResponse: metadata,
      })

      return {
        paymentId: payment.id,
        providerPayload: { clientSecret: paymentIntent.client_secret },
      }
    }

    if (!data.customerPhone) {
      throw httpError(422, 'customerPhone is required for mobile money payments')
    }

    const user = this.ctx.auth.user!
    // Always USD, regardless of country — the charge must match the
    // AWS-quoted price exactly, so there's no FX conversion to get wrong.
    const currency = resolveCurrencyForCountry(null)

    const result = await this.elgiopayService.createPayment({
      amount: amountCents,
      currency,
      payment_method: data.paymentMethod,
      customer_phone: data.customerPhone,
      customer_name: `${user.firstName} ${user.lastName}`,
      customer_email: user.email,
      reference: `domain-purchase-${data.domainName}-${Date.now()}`,
      metadata: { ...metadata },
    })

    const payment = await this.paymentRepository.create({
      subscriptionId: null,
      provider: 'elgiopay',
      providerTransactionId: result.transaction_id,
      amount: amountCents,
      currency,
      status: 'pending',
      customerPhone: data.customerPhone,
      failureReason: null,
      rawResponse: metadata,
    })

    return { paymentId: payment.id, providerPayload: { transactionId: result.transaction_id } }
  }

  /**
   * Polls the live gateway state for a pending domain-purchase payment.
   * Registration is submitted here, exactly once, on the pending ->
   * completed transition — never at checkout time.
   */
  async getPurchaseStatus(paymentId: number): Promise<{ status: string; domainName?: string }> {
    const payment = await this.paymentRepository.findById(paymentId)
    if (!payment) throw httpError(404, 'Payment not found')

    const metadata = payment.rawResponse as DomainPurchaseMetadata

    if (payment.status !== 'pending') {
      return { status: payment.status, domainName: metadata?.domainName }
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

    // Guards against a race between concurrent polls (or a poll racing the
    // webhook-less nature of this flow): only the caller that actually wins
    // the pending -> completed transition submits the AWS registration and
    // sends the invoice, so a domain is never registered twice.
    const justCompleted = await this.paymentRepository.markCompletedIfPending(payment.id)
    if (!justCompleted) {
      return { status: 'completed', domainName: metadata.domainName }
    }

    const domain = await this.submitRegistration(metadata)

    this.invoiceService.sendForPayment({
      paymentId: payment.id,
      recipient: {
        email: this.ctx.auth.user!.email,
        firstName: metadata.registrantContact.firstName,
        lastName: metadata.registrantContact.lastName,
        businessName: metadata.registrantContact.organizationName ?? null,
        addressLines: [
          metadata.registrantContact.addressLine1,
          metadata.registrantContact.addressLine2,
          [metadata.registrantContact.city, metadata.registrantContact.state]
            .filter(Boolean)
            .join(', '),
          [metadata.registrantContact.zipCode, metadata.registrantContact.countryCode]
            .filter(Boolean)
            .join(' '),
        ].filter((line): line is string => Boolean(line)),
      },
      description: `domain registration for ${metadata.domainName}`,
      items: [
        {
          description: `Domain registration — ${metadata.domainName} (1 year)`,
          amount: payment.amount,
        },
      ],
      currency: payment.currency,
    })

    return { status: 'completed', domainName: domain.name }
  }

  /**
   * The completed/failed states getPurchaseStatus returns only reflect the
   * *payment* (i.e. registration was submitted to AWS) — AWS registration
   * itself is asynchronous and finishes later, tracked here via the
   * Domain row that DomainRegistrationDispatchService's cron job updates.
   */
  async getRegistrationStatus(domainName: string): Promise<{ registrationStatus: string }> {
    const domain = await this.domainRepository.findByName(domainName)
    if (!domain) throw httpError(404, 'Domain not found')
    if (domain.userId !== this.userId) {
      throw httpError(403, 'You are not allowed to access this domain')
    }
    return { registrationStatus: domain.registrationStatus }
  }

  private async submitRegistration(metadata: DomainPurchaseMetadata) {
    const domain = await this.domainRepository.create({
      name: metadata.domainName,
      description: 'Purchased through MarrowMail',
      verified: false,
      userId: this.userId,
      customLoginHostname: null,
      customLoginHostnameVerified: false,
      mailFromVerified: false,
      registrationStatus: 'pending_registration',
      registrationOperationId: null,
      registrantContact: metadata.registrantContact,
      hostedZoneId: null,
      purchasedAt: DateTime.now(),
    })

    const operationId = await this.route53DomainsService.registerDomain(
      metadata.domainName,
      metadata.registrantContact
    )

    return this.domainRepository.update(domain, { registrationOperationId: operationId })
  }
}
