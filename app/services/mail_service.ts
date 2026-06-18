import MailRepository from '#repositories/mail_repository'
import { AuthMailAccountService } from '#services/auth_mail_account_service'
import { SESService } from '#services/ses_service'
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

    await mailAccount.load('domain')
    await mailAccount.load('profile')

    const fromEmail = `${mailAccount.username}@${mailAccount.domain.name}`
    const displayName = mailAccount.profile
      ? `${mailAccount.profile.firstName} ${mailAccount.profile.lastName}`
      : mailAccount.username
    const fromDisplay = `"${displayName}" <${fromEmail}>`

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
    })

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
}
