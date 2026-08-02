import type Mail from '#models/mail'
import MailAccountRepository from '#repositories/mail_account_repository'
import MailRepository from '#repositories/mail_repository'
import { SESService } from '#services/ses_service'
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
      await this.mailRepository.update(mail, { status: 'failed' })
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
      await this.mailRepository.update(mail, { status: 'failed' })
      this.logger.error(`Scheduled mail ${mail.id} is missing recipients or a subject`)
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
        const response = await this.sesService.sendRichEmail({
          from: fromDisplay,
          to,
          cc: (mail.ccAddresses as string[] | null) ?? undefined,
          bcc: (mail.bccAddresses as string[] | null) ?? undefined,
          replyTo: mail.replyTo ?? undefined,
          subject: mail.subject!,
          bodyHtml: mail.bodyHtml ?? undefined,
          bodyText: mail.bodyText ?? undefined,
        })
        await this.mailRepository.update(queued, {
          status: 'sent',
          sesMessageId: response.MessageId ?? null,
        })
        this.logger.info(`Scheduled mail ${queued.id} sent successfully`)
      },
      {
        retries: 2,
        retryDelayMs: 2000,
        onRetriesExhausted: async () => {
          await this.mailRepository.update(queued, { status: 'failed' })
          this.logger.error(`Scheduled mail ${queued.id} failed after retries`)
        },
      }
    )
  }
}
