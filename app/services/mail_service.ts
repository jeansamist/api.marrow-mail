import type MailAccount from '#models/mail_account'
import type Mail from '#models/mail'
import type File from '#models/file'
import FileRepository from '#repositories/file_repository'
import FolderRepository from '#repositories/folder_repository'
import MailAccountRepository from '#repositories/mail_account_repository'
import MailRepository from '#repositories/mail_repository'
import { AuthMailAccountService } from '#services/auth_mail_account_service'
import { MailAttachmentResolverService } from '#services/mail_attachment_resolver_service'
import { SESService } from '#services/ses_service'
import { SuppressionService } from '#services/suppression_service'
import { describeSendFailure } from '#utils/ses_send_error'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import { DateTime } from 'luxon'
import CronManager from '../managers/crons_manager.js'

interface SendMailPayload {
  to: string[]
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  subject: string
  bodyHtml?: string
  bodyText?: string
  attachmentIds?: number[]
}

interface DraftMailPayload {
  to?: string[]
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  subject?: string
  bodyHtml?: string
  bodyText?: string
  attachmentIds?: number[]
}

interface ForwardMailPayload {
  to: string[]
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  bodyHtml?: string
  bodyText?: string
}

interface ScheduleMailPayload extends SendMailPayload {
  scheduledAt: DateTime
}

@inject()
export class MailService {
  constructor(
    private readonly mailRepository: MailRepository,
    private readonly folderRepository: FolderRepository,
    private readonly mailAccountRepository: MailAccountRepository,
    private readonly authMailAccountService: AuthMailAccountService,
    private readonly sesService: SESService,
    private readonly suppressionService: SuppressionService,
    private readonly attachmentResolver: MailAttachmentResolverService,
    private readonly fileRepository: FileRepository,
    private readonly logger: Logger,
    private readonly cronManager: CronManager
  ) {}

  async sendMail(data: SendMailPayload) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(`Send mail from mail account: ${mailAccount.id} recipients: ${data.to.length}`)
    const { fromDisplay } = await this.buildFromDisplay(mailAccount)
    this.assertDomainVerified(mailAccount)

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
      attachmentIds: data.attachmentIds ?? null,
      important: false,
      isSpam: false,
      isRead: true,
      failureReason: null,
      deleted: false,
      folderId: null,
      scheduledAt: null,
    })

    this.queueSesSend(mail, fromDisplay, data)

    return mail
  }

  async fetchAllMail() {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(`Fetch all mail for mail account: ${mailAccount.id}`)
    return this.mailRepository.findByMailAccount(mailAccount.id)
  }

  async fetchAllSentMail() {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(`Fetch sent mail for mail account: ${mailAccount.id}`)
    return this.mailRepository.findByMailAccountAndDirection(mailAccount.id, 'sent')
  }

  async fetchAllReceivedMail() {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(`Fetch received mail for mail account: ${mailAccount.id}`)
    return this.mailRepository.findByMailAccountAndDirection(mailAccount.id, 'received')
  }

  async fetchDrafts() {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(`Fetch drafts for mail account: ${mailAccount.id}`)
    return this.mailRepository.findDraftsByMailAccount(mailAccount.id)
  }

  async saveDraft(data: DraftMailPayload) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(`Save draft for mail account: ${mailAccount.id}`)
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
      attachmentIds: data.attachmentIds ?? null,
      important: false,
      isSpam: false,
      isRead: true,
      failureReason: null,
      deleted: false,
      folderId: null,
      scheduledAt: null,
    })
  }

  async updateDraft(id: number, data: DraftMailPayload) {
    const { draft } = await this.getOwnedDraft(id)
    this.logger.info(`Update draft: ${draft.id} for mail account: ${draft.mailAccountId}`)

    return this.mailRepository.update(draft, {
      ...(data.to !== undefined && { toAddresses: data.to }),
      ...(data.cc !== undefined && { ccAddresses: data.cc }),
      ...(data.bcc !== undefined && { bccAddresses: data.bcc }),
      ...(data.replyTo !== undefined && { replyTo: data.replyTo }),
      ...(data.subject !== undefined && { subject: data.subject }),
      ...(data.bodyHtml !== undefined && { bodyHtml: data.bodyHtml }),
      ...(data.bodyText !== undefined && { bodyText: data.bodyText }),
      ...(data.attachmentIds !== undefined && { attachmentIds: data.attachmentIds }),
    })
  }

  async deleteDraft(id: number) {
    const { draft } = await this.getOwnedDraft(id)
    this.logger.info(`Delete draft: ${draft.id} for mail account: ${draft.mailAccountId}`)
    await this.mailRepository.delete(draft)
  }

  async sendDraft(id: number) {
    const { mailAccount, draft } = await this.getOwnedDraft(id)
    this.logger.info(`Send draft: ${draft.id} for mail account: ${mailAccount.id}`)

    const to = Array.isArray(draft.toAddresses) ? (draft.toAddresses as string[]) : []
    if (to.length === 0) {
      this.logger.warn(`Send draft rejected for draft: ${draft.id}: no recipients`)
      throw httpError(422, 'Draft has no recipients')
    }
    if (!draft.subject) {
      this.logger.warn(`Send draft rejected for draft: ${draft.id}: no subject`)
      throw httpError(422, 'Draft has no subject')
    }

    const { fromDisplay } = await this.buildFromDisplay(mailAccount)
    this.assertDomainVerified(mailAccount)
    const payload: SendMailPayload = {
      to,
      cc: (draft.ccAddresses as string[] | null) ?? undefined,
      bcc: (draft.bccAddresses as string[] | null) ?? undefined,
      replyTo: draft.replyTo ?? undefined,
      subject: draft.subject,
      bodyHtml: draft.bodyHtml ?? undefined,
      bodyText: draft.bodyText ?? undefined,
      attachmentIds: (draft.attachmentIds as number[] | null) ?? undefined,
    }

    const mail = await this.mailRepository.update(draft, {
      fromEmail: fromDisplay,
      status: 'queued',
    })

    this.queueSesSend(mail, fromDisplay, payload)

    return mail
  }

  async moveToFolder(id: number, folderId: number | null) {
    const { mailAccount, mail } = await this.getOwnedMail(id)
    this.logger.info(
      `Move mail: ${mail.id} to folder: ${folderId} for mail account: ${mailAccount.id}`
    )

    if (folderId !== null) {
      const folder = await this.folderRepository.findById(folderId)
      if (!folder || folder.mailAccountId !== mailAccount.id) {
        this.logger.warn(
          `Move mail rejected for mail: ${mail.id}: folder: ${folderId} not found for mail account: ${mailAccount.id}`
        )
        throw httpError(404, 'Folder not found')
      }
    }

    return this.mailRepository.update(mail, { folderId })
  }

  async markSpam(id: number, isSpam: boolean) {
    const { mail } = await this.getOwnedMail(id)
    this.logger.info(`Mark mail: ${mail.id} spam: ${isSpam}`)
    return this.mailRepository.update(mail, { isSpam })
  }

  async markImportant(id: number, important: boolean) {
    const { mail } = await this.getOwnedMail(id)
    this.logger.info(`Mark mail: ${mail.id} important: ${important}`)
    return this.mailRepository.update(mail, { important })
  }

  async markRead(id: number, isRead: boolean) {
    const { mail } = await this.getOwnedMail(id)
    this.logger.info(`Mark mail: ${mail.id} read: ${isRead}`)
    return this.mailRepository.update(mail, { isRead })
  }

  async trashMail(id: number) {
    const { mail } = await this.getOwnedMail(id)
    this.logger.info(`Trash mail: ${mail.id}`)
    return this.mailRepository.update(mail, { deleted: true })
  }

  async restoreMail(id: number) {
    const { mail } = await this.getOwnedTrashedMail(id)
    this.logger.info(`Restore mail: ${mail.id} from trash`)
    return this.mailRepository.update(mail, { deleted: false })
  }

  async permanentlyDeleteMail(id: number) {
    const { mail } = await this.getOwnedTrashedMail(id)
    this.logger.info(`Permanently delete mail: ${mail.id}`)
    await this.mailRepository.delete(mail)
  }

  async fetchTrash() {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(`Fetch trash for mail account: ${mailAccount.id}`)
    return this.mailRepository.findTrashByMailAccount(mailAccount.id)
  }

  async fetchSpam() {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(`Fetch spam for mail account: ${mailAccount.id}`)
    return this.mailRepository.findSpamByMailAccount(mailAccount.id)
  }

  async forwardMail(id: number, data: ForwardMailPayload) {
    const { mail: original } = await this.getOwnedMail(id)
    this.logger.info(`Forward mail: ${original.id} recipients: ${data.to.length}`)

    const subject = original.subject?.trim().toLowerCase().startsWith('fwd:')
      ? original.subject
      : `Fwd: ${original.subject ?? '(no subject)'}`

    const forwardedHeaderText = [
      '---------- Forwarded message ----------',
      `From: ${original.fromEmail}`,
      original.subject ? `Subject: ${original.subject}` : null,
    ]
      .filter((line): line is string => !!line)
      .join('\n')

    const bodyText = [data.bodyText, forwardedHeaderText, original.bodyText]
      .filter((part): part is string => !!part)
      .join('\n\n')

    const bodyHtml = [
      data.bodyHtml,
      `<p>${forwardedHeaderText.replace(/\n/g, '<br/>')}</p>`,
      original.bodyHtml,
    ]
      .filter((part): part is string => !!part)
      .join('<br/><br/>')

    return this.sendMail({
      to: data.to,
      cc: data.cc,
      bcc: data.bcc,
      replyTo: data.replyTo,
      subject,
      bodyHtml: original.bodyHtml || data.bodyHtml ? bodyHtml : undefined,
      bodyText: original.bodyText || data.bodyText ? bodyText : undefined,
      attachmentIds: (original.attachmentIds as number[] | null) ?? undefined,
    })
  }

  async fetchScheduledMails() {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(`Fetch scheduled mails for mail account: ${mailAccount.id}`)
    return this.mailRepository.findScheduledByMailAccount(mailAccount.id)
  }

  async scheduleMail(data: ScheduleMailPayload) {
    if (data.scheduledAt <= DateTime.now()) {
      this.logger.warn(
        `Schedule mail rejected: scheduledAt: ${data.scheduledAt.toISO()} is in the past`
      )
      throw httpError(422, 'scheduledAt must be in the future')
    }

    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(
      `Schedule mail for mail account: ${mailAccount.id} recipients: ${data.to.length} scheduledAt: ${data.scheduledAt.toISO()}`
    )
    const { fromDisplay } = await this.buildFromDisplay(mailAccount)
    this.assertDomainVerified(mailAccount)

    return this.mailRepository.create({
      mailAccountId: mailAccount.id,
      fromEmail: fromDisplay,
      toAddresses: data.to,
      ccAddresses: data.cc ?? null,
      bccAddresses: data.bcc ?? null,
      replyTo: data.replyTo ?? null,
      subject: data.subject,
      bodyHtml: data.bodyHtml ?? null,
      bodyText: data.bodyText ?? null,
      status: 'scheduled',
      direction: 'sent',
      sesMessageId: null,
      attachmentIds: data.attachmentIds ?? null,
      important: false,
      isSpam: false,
      isRead: true,
      failureReason: null,
      deleted: false,
      folderId: null,
      scheduledAt: data.scheduledAt,
    })
  }

  async rescheduleMail(id: number, scheduledAt: DateTime) {
    if (scheduledAt <= DateTime.now()) {
      this.logger.warn(
        `Reschedule mail rejected for mail: ${id}: scheduledAt: ${scheduledAt.toISO()} is in the past`
      )
      throw httpError(422, 'scheduledAt must be in the future')
    }

    const { scheduled } = await this.getOwnedScheduledMail(id)
    this.logger.info(`Reschedule mail: ${scheduled.id} scheduledAt: ${scheduledAt.toISO()}`)
    return this.mailRepository.update(scheduled, { scheduledAt })
  }

  async cancelScheduledMail(id: number) {
    const { scheduled } = await this.getOwnedScheduledMail(id)
    this.logger.info(`Cancel scheduled mail: ${scheduled.id}`)
    return this.mailRepository.update(scheduled, { status: 'draft', scheduledAt: null })
  }

  private async getOwnedScheduledMail(id: number): Promise<{
    mailAccount: MailAccount
    scheduled: Mail
  }> {
    const { mailAccount, mail } = await this.getOwnedMail(id)
    if (mail.status !== 'scheduled') {
      this.logger.warn(`Scheduled mail not found for mail: ${mail.id} status: ${mail.status}`)
      throw httpError(404, 'Scheduled mail not found')
    }
    return { mailAccount, scheduled: mail }
  }

  /** Resolves a mail's attachmentIds to full file metadata (name, size, download URL). */
  async getAttachments(id: number): Promise<File[]> {
    const { mail } = await this.getOwnedMail(id)
    const attachmentIds = (mail.attachmentIds as number[] | null) ?? []
    this.logger.info(`Get attachments for mail: ${mail.id} count: ${attachmentIds.length}`)
    if (attachmentIds.length === 0) return []

    const files = await Promise.all(
      attachmentIds.map((fileId) => this.fileRepository.findById(fileId))
    )
    return files.filter((file): file is File => file !== null)
  }

  private async getOwnedMail(id: number): Promise<{ mailAccount: MailAccount; mail: Mail }> {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    const mail = await this.mailRepository.findById(id)
    if (!mail || mail.mailAccountId !== mailAccount.id) {
      this.logger.warn(`Mail not found: ${id} for mail account: ${mailAccount.id}`)
      throw httpError(404, 'Mail not found')
    }
    return { mailAccount, mail }
  }

  private async getOwnedDraft(id: number): Promise<{ mailAccount: MailAccount; draft: Mail }> {
    const { mailAccount, mail } = await this.getOwnedMail(id)
    if (mail.status !== 'draft') {
      this.logger.warn(`Draft not found for mail: ${mail.id} status: ${mail.status}`)
      throw httpError(404, 'Draft not found')
    }
    return { mailAccount, draft: mail }
  }

  private async getOwnedTrashedMail(id: number): Promise<{ mailAccount: MailAccount; mail: Mail }> {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    const mail = await this.mailRepository.findById(id)
    if (!mail || mail.mailAccountId !== mailAccount.id || !mail.deleted) {
      this.logger.warn(`Mail not found in trash: ${id} for mail account: ${mailAccount.id}`)
      throw httpError(404, 'Mail not found in trash')
    }
    return { mailAccount, mail }
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

  /**
   * Fails fast, before ever queuing a send, when the cached domain
   * verification flag is already known to be false — avoids a doomed
   * background job and gives the caller an immediate, actionable error.
   * Requires mailAccount.domain to already be loaded (see buildFromDisplay).
   */
  private assertDomainVerified(mailAccount: MailAccount) {
    if (!mailAccount.domain.verified) {
      this.logger.warn(
        `Send rejected for mail account: ${mailAccount.id}: domain: ${mailAccount.domain.name} not verified`
      )
      throw httpError(
        422,
        `The domain ${mailAccount.domain.name} is not verified for sending mail. Verify it before sending.`
      )
    }
  }

  private async findSuppressedRecipients(recipients: string[]): Promise<string[]> {
    const results = await Promise.all(
      recipients.map(async (email) => ({
        email,
        suppressed: await this.suppressionService.isSuppressed(email),
      }))
    )
    return results.filter((r) => r.suppressed).map((r) => r.email)
  }

  private queueSesSend(mail: Mail, fromDisplay: string, data: SendMailPayload) {
    this.logger.info(
      `Queue SES send for mail: ${mail.id} from mail account: ${mail.mailAccountId} recipients: ${data.to.length}`
    )
    this.cronManager.addQueueJob(
      'mails',
      async () => {
        const suppressedRecipients = await this.findSuppressedRecipients(data.to)
        if (suppressedRecipients.length > 0) {
          const message = `Recipient previously bounced or complained: ${suppressedRecipients.join(', ')}`
          await this.mailRepository.update(mail, { status: 'failed', failureReason: message })
          this.logger.warn(`Mail ${mail.id} not sent — ${message}`)
          return
        }

        const { attachments, voiceNoteHtml } = await this.attachmentResolver.resolve(
          data.attachmentIds
        )
        const bodyHtml = voiceNoteHtml ? `${data.bodyHtml ?? ''}${voiceNoteHtml}` : data.bodyHtml

        this.logger.info(
          `Send mail: ${mail.id} via SES recipients: ${data.to.length} attachments: ${attachments.length}`
        )
        const response = await this.sesService.sendRichEmail({
          from: fromDisplay,
          to: data.to,
          cc: data.cc,
          bcc: data.bcc,
          replyTo: data.replyTo,
          subject: data.subject,
          bodyHtml,
          bodyText: data.bodyText,
          attachments,
        })
        await this.mailRepository.update(mail, {
          status: 'sent',
          sesMessageId: response.MessageId ?? null,
          failureReason: null,
        })
        this.logger.info(`Mail ${mail.id} sent successfully`)
      },
      {
        retries: 2,
        retryDelayMs: 2000,
        onRetriesExhausted: async ({ error }) => {
          const { message, isUnverifiedIdentity } = describeSendFailure(error)
          await this.mailRepository.update(mail, { status: 'failed', failureReason: message })
          this.logger.error(`Mail ${mail.id} failed after retries: ${message}`)

          if (isUnverifiedIdentity) {
            await this.reconcileDomainVerification(mail.mailAccountId)
          }
        },
      }
    )
  }

  /**
   * Self-heals the cached domains.verified flag when a send fails for a
   * reason that indicates the identity is actually gone from SES (e.g.
   * deleted out-of-band in the AWS console), so the next send attempt fails
   * fast via assertDomainVerified instead of repeating the same silent
   * background failure.
   */
  private async reconcileDomainVerification(mailAccountId: number) {
    this.logger.info(
      `Reconcile domain verification for mail account: ${mailAccountId} after send failure`
    )
    const mailAccount = await this.mailAccountRepository.findById(mailAccountId)
    if (!mailAccount) {
      this.logger.warn(`Skip domain reconciliation: mail account: ${mailAccountId} not found`)
      return
    }
    await mailAccount.load('domain')
    if (!mailAccount.domain.verified) {
      this.logger.info(
        `Skip domain reconciliation for mail account: ${mailAccount.id}: domain: ${mailAccount.domain.name} already unverified`
      )
      return
    }

    this.logger.warn(
      `[MailService]: Marking domain ${mailAccount.domain.name} unverified after a send failure`
    )
    await mailAccount.domain.merge({ verified: false }).save()
  }
}
