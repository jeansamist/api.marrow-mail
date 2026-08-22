import type Mail from '#models/mail'
import MailAccountRepository from '#repositories/mail_account_repository'
import MailRepository from '#repositories/mail_repository'
import { MailAttachmentResolverService } from '#services/mail_attachment_resolver_service'
import { SESService } from '#services/ses_service'
import { SuppressionService } from '#services/suppression_service'
import { describeSendFailure } from '#utils/ses_send_error'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import { DateTime } from 'luxon'
import CronManager from '../managers/crons_manager.js'

/**
 * Sends mail that was scheduled ahead of time via MailService.scheduleMail.
 * Runs from a recurring cron job (see start/scheduler.ts), outside of any
 * HTTP request, so — unlike MailService — it can't rely on an authenticated
 * "current mail account" and instead resolves each mail's own account.
 */
@inject()
export class ScheduledMailDispatchService {
  constructor(
    private readonly mailRepository: MailRepository,
    private readonly mailAccountRepository: MailAccountRepository,
    private readonly sesService: SESService,
    private readonly suppressionService: SuppressionService,
    private readonly attachmentResolver: MailAttachmentResolverService,
    private readonly logger: Logger,
    private readonly cronManager: CronManager
  ) {}

  async dispatchDueMails(): Promise<void> {
    const dueMails = await this.mailRepository.findDueScheduledMails(DateTime.now())
    for (const mail of dueMails) {
      await this.dispatchOne(mail)
    }
  }

  private async dispatchOne(mail: Mail): Promise<void> {
    const mailAccount = await this.mailAccountRepository.findById(mail.mailAccountId)
    if (!mailAccount) {
      await this.mailRepository.update(mail, {
        status: 'failed',
        failureReason: 'The owning mail account no longer exists',
      })
      this.logger.error(`Scheduled mail ${mail.id} has no owning mail account`)
      return
    }

    await mailAccount.load('domain')
    await mailAccount.load('profile')

    const fromEmail = `${mailAccount.username}@${mailAccount.domain.name}`
    const displayName = mailAccount.profile
      ? `${mailAccount.profile.firstName} ${mailAccount.profile.lastName}`
      : mailAccount.username
    const fromDisplay = `"${displayName}" <${fromEmail}>`

    const to = Array.isArray(mail.toAddresses) ? (mail.toAddresses as string[]) : []
    if (to.length === 0 || !mail.subject) {
      await this.mailRepository.update(mail, {
        status: 'failed',
        failureReason: 'Missing recipients or a subject',
      })
      this.logger.error(`Scheduled mail ${mail.id} is missing recipients or a subject`)
      return
    }

    if (!mailAccount.domain.verified) {
      await this.mailRepository.update(mail, {
        status: 'failed',
        failureReason: `The domain ${mailAccount.domain.name} is not verified for sending mail`,
      })
      this.logger.error(
        `Scheduled mail ${mail.id} not sent: domain ${mailAccount.domain.name} is not verified`
      )
      return
    }

    const suppressed = await Promise.all(
      to.map((email) => this.suppressionService.isSuppressed(email))
    )
    const suppressedRecipients = to.filter((_, i) => suppressed[i])
    if (suppressedRecipients.length > 0) {
      const message = `Recipient previously bounced or complained: ${suppressedRecipients.join(', ')}`
      await this.mailRepository.update(mail, { status: 'failed', failureReason: message })
      this.logger.warn(`Scheduled mail ${mail.id} not sent — ${message}`)
      return
    }

    // Flip to "queued" before handing off so an overlapping run of this cron
    // can't pick the same mail up twice.
    const queued = await this.mailRepository.update(mail, {
      status: 'queued',
      fromEmail: fromDisplay,
    })

    this.cronManager.addQueueJob(
      'mails',
      async () => {
        const { attachments, voiceNoteHtml } = await this.attachmentResolver.resolve(
          (mail.attachmentIds as number[] | null) ?? undefined
        )
        const bodyHtml = voiceNoteHtml
          ? `${mail.bodyHtml ?? ''}${voiceNoteHtml}`
          : (mail.bodyHtml ?? undefined)

        const response = await this.sesService.sendRichEmail({
          from: fromDisplay,
          to,
          cc: (mail.ccAddresses as string[] | null) ?? undefined,
          bcc: (mail.bccAddresses as string[] | null) ?? undefined,
          replyTo: mail.replyTo ?? undefined,
          subject: mail.subject!,
          bodyHtml,
          bodyText: mail.bodyText ?? undefined,
          attachments,
        })
        await this.mailRepository.update(queued, {
          status: 'sent',
          sesMessageId: response.MessageId ?? null,
          failureReason: null,
        })
        this.logger.info(`Scheduled mail ${queued.id} sent successfully`)
      },
      {
        retries: 2,
        retryDelayMs: 2000,
        onRetriesExhausted: async ({ error }) => {
          const { message, isUnverifiedIdentity } = describeSendFailure(error)
          await this.mailRepository.update(queued, { status: 'failed', failureReason: message })
          this.logger.error(`Scheduled mail ${queued.id} failed after retries: ${message}`)

          if (isUnverifiedIdentity && mailAccount.domain.verified) {
            this.logger.warn(
              `[ScheduledMailDispatchService]: Marking domain ${mailAccount.domain.name} unverified after a send failure`
            )
            await mailAccount.domain.merge({ verified: false }).save()
          }
        },
      }
    )
  }
}
