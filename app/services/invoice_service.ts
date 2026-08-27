import InvoiceNotification from '#mails/invoice_notification'
import {
  formatInvoiceMoney,
  renderInvoicePdf,
  type InvoiceData,
  type InvoiceLineItem,
} from '#pdf/invoice_document'
import UserRepository from '#repositories/user_repository'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import CronManager from '../managers/crons_manager.js'

export interface InvoiceRecipient {
  email: string
  firstName: string
  lastName: string
  businessName?: string | null
  addressLines?: string[]
}

interface SendInvoiceParams {
  paymentId: number
  // A plain recipient when the caller already has one synchronously
  // (ctx.auth.user, checkout metadata), or a thunk when resolving it needs
  // an async DB call (subscription webhooks, which run with no ctx.auth.user
  // and must look the owner up via subscription.userId). The thunk is
  // resolved inside the same queued job as PDF/email — see sendForPayment.
  recipient: InvoiceRecipient | (() => Promise<InvoiceRecipient | null>)
  description: string
  items: InvoiceLineItem[]
  currency: string
}

@inject()
export class InvoiceService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cronManager: CronManager,
    private readonly logger: Logger
  ) {}

  async userAsRecipient(userId: number): Promise<InvoiceRecipient | null> {
    this.logger.info(`Resolve invoice recipient for user: ${userId}`)
    const user = await this.userRepository.findById(userId)
    if (!user) {
      this.logger.warn(`Invoice recipient not found for user: ${userId}`)
      return null
    }
    return {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      businessName: user.businessName,
    }
  }

  /**
   * Queues an invoice PDF + email for a completed payment. Fire-and-forget
   * by design (queued onto the existing background-job mechanism, retried
   * on failure) — invoice delivery must never block or fail the actual
   * payment-completion flow (domain registration, subscription activation,
   * storage bump). Nothing here runs synchronously in the caller's stack,
   * including recipient resolution when it's a thunk, so a DB hiccup or
   * render/send failure can never propagate back and abort that flow.
   */
  sendForPayment(params: SendInvoiceParams): void {
    const invoiceNumber = `INV-${params.paymentId}`
    const total = params.items.reduce((sum, item) => sum + item.amount, 0)
    this.logger.info(
      `Queue invoice: ${invoiceNumber} for payment: ${params.paymentId} items: ${params.items.length} total: ${total} currency: ${params.currency}`
    )

    this.cronManager.addQueueJob(
      'invoices',
      async () => {
        const recipient =
          typeof params.recipient === 'function' ? await params.recipient() : params.recipient
        if (!recipient) {
          this.logger.warn(
            `Skip invoice: ${invoiceNumber} for payment: ${params.paymentId}: recipient not found`
          )
          return
        }
        this.logger.info(
          `Send invoice: ${invoiceNumber} for payment: ${params.paymentId} to: ${recipient.email}`
        )

        const data: InvoiceData = {
          invoiceNumber,
          date: DateTime.now().toFormat('dd LLL yyyy'),
          currency: params.currency,
          billTo: {
            name: `${recipient.firstName} ${recipient.lastName}`.trim(),
            email: recipient.email,
            businessName: recipient.businessName,
            addressLines: recipient.addressLines,
          },
          items: params.items,
          total,
        }

        const pdfBuffer = await renderInvoicePdf(data)
        await mail.send(
          new InvoiceNotification(
            recipient.email,
            recipient.firstName,
            invoiceNumber,
            params.description,
            formatInvoiceMoney(total, params.currency),
            pdfBuffer
          )
        )
        this.logger.info(
          `Sent invoice: ${invoiceNumber} for payment: ${params.paymentId} to: ${recipient.email}`
        )
      },
      {
        retries: 2,
        retryDelayMs: 1000,
        onRetriesExhausted: ({ error }) => {
          this.logger.error(
            `Failed to send invoice ${invoiceNumber} for payment ${params.paymentId}: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
        },
      }
    )
  }
}
