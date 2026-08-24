import ContactRepository from '#repositories/contact_repository'
import FileRepository from '#repositories/file_repository'
import MailAccountRepository from '#repositories/mail_account_repository'
import MailAccountProfileRepository from '#repositories/mail_account_profile_repository'
import MailRepository from '#repositories/mail_repository'
import PaymentRepository from '#repositories/payment_repository'
import SignatureRepository from '#repositories/signature_repository'
import SubscriptionRepository from '#repositories/subscription_repository'
import { ElgiopayService } from '#services/elgiopay_service'
import { GeoService } from '#services/geo_service'
import { InvoiceService } from '#services/invoice_service'
import { StripeService } from '#services/stripe_service'
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
    private readonly mailRepository: MailRepository,
    private readonly mailAccountProfileRepository: MailAccountProfileRepository,
    private readonly signatureRepository: SignatureRepository,
    private readonly contactRepository: ContactRepository,
    private readonly mailAccountRepository: MailAccountRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly stripeService: StripeService,
    private readonly elgiopayService: ElgiopayService,
    private readonly geoService: GeoService,
    private readonly invoiceService: InvoiceService,
    private readonly ctx: HttpContext
  ) {}

  private get userId() {
    return this.ctx.auth.user!.id
  }

  /**
   * Resolves the plan-derived default quota for a given owner. Takes an
   * explicit userId rather than reading ctx.auth.user — this is also called
   * from mail-account-JWT-authenticated requests (upload-link creation),
   * which never populate the main auth guard at all.
   */
  private async defaultQuotaBytesForOwner(userId: number): Promise<number> {
    const subscription =
      (await this.subscriptionRepository.findLatestActiveForUser(userId)) ??
      (await this.subscriptionRepository.findLatestForUser(userId))
    return defaultStorageBytesForPlan((subscription?.planId as PlanId) ?? 'core')
  }

  /**
   * Total on-disk footprint per mail account — S3 files (attachments,
   * avatars, logos) plus everything stored only in Postgres (email
   * subject/bodies, profile fields, signature, contacts). Everything the
   * account actually occupies, not just what happens to live in S3.
   */
  private async usedBytesByAccount(mailAccountIds: number[]): Promise<Map<number, number>> {
    const usageByAccount = new Map<number, number>()
    if (mailAccountIds.length === 0) return usageByAccount

    const sources = await Promise.all([
      this.fileRepository.sumSizeByMailAccountIds(mailAccountIds),
      this.mailRepository.sumContentSizeByMailAccountIds(mailAccountIds),
      this.mailAccountProfileRepository.sumContentSizeByMailAccountIds(mailAccountIds),
      this.signatureRepository.sumContentSizeByMailAccountIds(mailAccountIds),
      this.contactRepository.sumContentSizeByMailAccountIds(mailAccountIds),
    ])

    for (const id of mailAccountIds) {
      usageByAccount.set(
        id,
        sources.reduce((sum, source) => sum + (source.get(id) ?? 0), 0)
      )
    }
    return usageByAccount
  }

  private async usedBytesForAccount(mailAccountId: number): Promise<number> {
    const usageByAccount = await this.usedBytesByAccount([mailAccountId])
    return usageByAccount.get(mailAccountId) ?? 0
  }

  async getUsageForCurrentUser() {
    const [mailAccounts, defaultQuotaBytes] = await Promise.all([
      this.mailAccountRepository.findAllByUserId(this.userId),
      this.defaultQuotaBytesForOwner(this.userId),
    ])
    const usageByAccount = await this.usedBytesByAccount(mailAccounts.map((account) => account.id))

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

  async assertWithinQuota(mailAccountId: number, additionalBytes: number): Promise<void> {
    const mailAccount = await this.mailAccountRepository.findById(mailAccountId)
    if (!mailAccount) throw httpError(404, 'Mail account not found')

    const usedBytes = await this.usedBytesForAccount(mailAccountId)
    const quotaBytes = Number(
      mailAccount.storageQuotaBytes ?? (await this.defaultQuotaBytesForOwner(mailAccount.userId!))
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

    // TEMPORARY: card/Stripe payments are blocked for now. Uncomment below to re-enable.
    if (data.paymentMethod === 'card') {
      throw httpError(503, 'Card payments are temporarily unavailable — please use mobile money.')
    }
    void this.stripeCurrency // referenced so it isn't flagged unused while blocked above.
    // if (data.paymentMethod === 'card') {
    //   const currency = this.stripeCurrency()
    //   const paymentIntent = await this.stripeService.client.paymentIntents.create({
    //     amount,
    //     currency,
    //     metadata: {
    //       userId: String(this.userId),
    //       mailAccountId: String(data.mailAccountId),
    //       extraGB: String(data.extraGB),
    //     },
    //   })
    //
    //   const payment = await this.paymentRepository.create({
    //     subscriptionId: subscription.id,
    //     provider: 'stripe',
    //     providerTransactionId: paymentIntent.id,
    //     amount,
    //     currency: currency.toUpperCase(),
    //     status: 'pending',
    //     customerPhone: null,
    //     failureReason: null,
    //     rawResponse: metadata,
    //   })
    //
    //   return {
    //     paymentId: payment.id,
    //     providerPayload: { clientSecret: paymentIntent.client_secret },
    //   }
    // }

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

    const subscription = payment.subscriptionId
      ? await this.subscriptionRepository.findById(payment.subscriptionId)
      : null
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

    // Guards against a race between concurrent polls: only the caller that
    // actually wins the pending -> completed transition applies the quota
    // bump and sends the invoice, so extra storage is never granted twice.
    const justCompleted = await this.paymentRepository.markCompletedIfPending(payment.id)
    if (!justCompleted) return { status: 'completed' }

    const metadata = payment.rawResponse as StorageAddonMetadata
    await this.applyStorageAddon(metadata)

    const mailAccount = await this.mailAccountRepository.findById(metadata.mailAccountId)
    const user = this.ctx.auth.user!
    this.invoiceService.sendForPayment({
      paymentId: payment.id,
      recipient: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
      },
      description: `${metadata.extraGB} GB of extra storage`,
      items: [
        {
          description: `Extra storage — ${metadata.extraGB} GB${
            mailAccount ? ` (mailbox: ${mailAccount.username})` : ''
          }`,
          amount: payment.amount,
        },
      ],
      currency: payment.currency,
    })

    return { status: 'completed' }
  }

  private async applyStorageAddon(metadata: StorageAddonMetadata): Promise<void> {
    const mailAccount = await this.mailAccountRepository.findById(metadata.mailAccountId)
    if (!mailAccount) return

    const currentQuotaBytes = Number(
      mailAccount.storageQuotaBytes ?? (await this.defaultQuotaBytesForOwner(mailAccount.userId!))
    )
    await this.mailAccountRepository.update(mailAccount, {
      storageQuotaBytes: currentQuotaBytes + metadata.extraGB * BYTES_PER_GB,
    })
  }

  private stripeCurrency(): string {
    return env.get('STRIPE_CURRENCY').toLowerCase()
  }
}
