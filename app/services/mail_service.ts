import type MailAccount from '#models/mail_account'
import type Mail from '#models/mail'
import MailRepository from '#repositories/mail_repository'
import { AuthMailAccountService } from '#services/auth_mail_account_service'
import { SESService } from '#services/ses_service'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import CronManager from '../managers/crons_manager.js'

interface SendMailPayload {
  to: string[]
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  subject: string
  bodyHtml?: string
  bodyText?: string
}

interface DraftMailPayload {
  to?: string[]
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  subject?: string
  bodyHtml?: string
  bodyText?: string
}

@inject()
export class MailService {
  constructor(
    private readonly mailRepository: MailRepository,
    private readonly authMailAccountService: AuthMailAccountService,
    private readonly sesService: SESService,
    private readonly logger: Logger,
    private readonly cronManager: CronManager
  ) {}

  async sendMail(data: SendMailPayload) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    const { fromDisplay } = await this.buildFromDisplay(mailAccount)

    const mail = await this.mailRepository.create({
      mailAccountId: mailAccount.id,
      fromEmail: fromDisplay,
      toAddresses: data.to,
      ccAddresses: data.cc ?? null,
      bccAddresses: data.bcc ?? null,
      replyTo: data.replyTo ?? null,
      subject: data.subject,
      bodyHtml: data.bodyHtml ?? null,
      bodyText: data.bodyText ?? null,
      status: 'queued',
      direction: 'sent',
      sesMessageId: null,
      attachmentIds: null,
      important: false,
      isSpam: false,
      deleted: false,
    })

    this.queueSesSend(mail, fromDisplay, data)

    return mail
  }

  async fetchAllMail() {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    return this.mailRepository.findByMailAccount(mailAccount.id)
  }

  async fetchAllSentMail() {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    return this.mailRepository.findByMailAccountAndDirection(mailAccount.id, 'sent')
  }

  async fetchAllReceivedMail() {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    return this.mailRepository.findByMailAccountAndDirection(mailAccount.id, 'received')
  }

  async fetchDrafts() {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    return this.mailRepository.findDraftsByMailAccount(mailAccount.id)
  }

  async saveDraft(data: DraftMailPayload) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    const { fromDisplay } = await this.buildFromDisplay(mailAccount)

    return this.mailRepository.create({
      mailAccountId: mailAccount.id,
      fromEmail: fromDisplay,
      toAddresses: data.to ?? null,
      ccAddresses: data.cc ?? null,
      bccAddresses: data.bcc ?? null,
      replyTo: data.replyTo ?? null,
      subject: data.subject ?? null,
      bodyHtml: data.bodyHtml ?? null,
      bodyText: data.bodyText ?? null,
      status: 'draft',
      direction: 'sent',
      sesMessageId: null,
      attachmentIds: null,
      important: false,
      isSpam: false,
      deleted: false,
    })
  }

  async updateDraft(id: number, data: DraftMailPayload) {
    const { draft } = await this.getOwnedDraft(id)

    return this.mailRepository.update(draft, {
      ...(data.to !== undefined && { toAddresses: data.to }),
      ...(data.cc !== undefined && { ccAddresses: data.cc }),
      ...(data.bcc !== undefined && { bccAddresses: data.bcc }),
      ...(data.replyTo !== undefined && { replyTo: data.replyTo }),
      ...(data.subject !== undefined && { subject: data.subject }),
      ...(data.bodyHtml !== undefined && { bodyHtml: data.bodyHtml }),
      ...(data.bodyText !== undefined && { bodyText: data.bodyText }),
    })
  }

  async deleteDraft(id: number) {
    const { draft } = await this.getOwnedDraft(id)
    await this.mailRepository.delete(draft)
  }

  async sendDraft(id: number) {
    const { mailAccount, draft } = await this.getOwnedDraft(id)

    const to = Array.isArray(draft.toAddresses) ? (draft.toAddresses as string[]) : []
    if (to.length === 0) throw httpError(422, 'Draft has no recipients')
    if (!draft.subject) throw httpError(422, 'Draft has no subject')

    const { fromDisplay } = await this.buildFromDisplay(mailAccount)
    const payload: SendMailPayload = {
      to,
      cc: (draft.ccAddresses as string[] | null) ?? undefined,
      bcc: (draft.bccAddresses as string[] | null) ?? undefined,
      replyTo: draft.replyTo ?? undefined,
      subject: draft.subject,
      bodyHtml: draft.bodyHtml ?? undefined,
      bodyText: draft.bodyText ?? undefined,
    }

    const mail = await this.mailRepository.update(draft, {
      fromEmail: fromDisplay,
      status: 'queued',
    })

    this.queueSesSend(mail, fromDisplay, payload)

    return mail
  }

  private async getOwnedDraft(id: number): Promise<{ mailAccount: MailAccount; draft: Mail }> {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    const draft = await this.mailRepository.findById(id)
    if (!draft || draft.mailAccountId !== mailAccount.id || draft.status !== 'draft') {
      throw httpError(404, 'Draft not found')
    }
    return { mailAccount, draft }
  }

  private async buildFromDisplay(mailAccount: MailAccount) {
    await mailAccount.load('domain')
    await mailAccount.load('profile')

    const fromEmail = `${mailAccount.username}@${mailAccount.domain.name}`
    const displayName = mailAccount.profile
      ? `${mailAccount.profile.firstName} ${mailAccount.profile.lastName}`
      : mailAccount.username

    return { fromEmail, fromDisplay: `"${displayName}" <${fromEmail}>` }
  }

  private queueSesSend(mail: Mail, fromDisplay: string, data: SendMailPayload) {
    this.cronManager.addQueueJob(
      'mails',
      async () => {
        const response = await this.sesService.sendRichEmail({
          from: fromDisplay,
          to: data.to,
          cc: data.cc,
          bcc: data.bcc,
          replyTo: data.replyTo,
          subject: data.subject,
          bodyHtml: data.bodyHtml,
          bodyText: data.bodyText,
        })
        await this.mailRepository.update(mail, {
          status: 'sent',
          sesMessageId: response.MessageId ?? null,
        })
        this.logger.info(`Mail ${mail.id} sent successfully`)
      },
      {
        retries: 2,
        retryDelayMs: 2000,
        onRetriesExhausted: async () => {
          await this.mailRepository.update(mail, { status: 'failed' })
          this.logger.error(`Mail ${mail.id} failed after retries`)
        },
      }
    )
  }
}
