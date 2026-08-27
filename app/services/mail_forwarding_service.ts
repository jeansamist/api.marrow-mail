import MailForwardingVerificationNotification from '#mails/mail_forwarding_verification_notification'
import MailAccountRepository from '#repositories/mail_account_repository'
import { AuthMailAccountService } from '#services/auth_mail_account_service'
import env from '#start/env'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import CronManager from '../managers/crons_manager.js'

@inject()
export class MailForwardingService {
  constructor(
    private readonly repository: MailAccountRepository,
    private readonly authMailAccountService: AuthMailAccountService,
    private readonly logger: Logger,
    private readonly cronManager: CronManager
  ) {}

  async setForwardingEmail(forwardingEmail: string): Promise<void> {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(`Set forwarding email: ${forwardingEmail} for mail account: ${mailAccount.id}`)

    const verificationToken = this.generateVerificationToken()
    const verificationTokenExpiresAt = DateTime.now().plus({ hours: 1 })

    await this.repository.update(mailAccount, {
      forwardingEmail,
      forwardingVerified: false,
      forwardingVerificationToken: verificationToken,
      forwardingVerificationTokenExpiresAt: verificationTokenExpiresAt,
    })

    await mailAccount.load('domain')
    const mailAccountEmail = `${mailAccount.username}@${mailAccount.domain.name}`
    const verificationLink =
      env.get('FRONTEND_APP_URL') +
      `/mail-auth/verify-forwarding?token=${encodeURIComponent(verificationToken)}`

    this.queueVerificationEmail(forwardingEmail, mailAccountEmail, verificationLink)
  }

  async verifyForwardingEmail(token: string): Promise<boolean> {
    const mailAccount = await this.repository.findByForwardingVerificationToken(token)
    if (!mailAccount) {
      this.logger.warn('Forwarding verification rejected: no mail account matches the token')
      return false
    }
    if (
      mailAccount.forwardingVerificationTokenExpiresAt &&
      mailAccount.forwardingVerificationTokenExpiresAt < DateTime.now()
    ) {
      this.logger.warn(
        `Forwarding verification rejected for mail account: ${mailAccount.id}: token expired`
      )
      return false
    }

    await this.repository.update(mailAccount, {
      forwardingVerified: true,
      forwardingVerificationToken: null,
      forwardingVerificationTokenExpiresAt: null,
    })

    this.logger.info(
      `Verified forwarding email: ${mailAccount.forwardingEmail} for mail account: ${mailAccount.id}`
    )
    return true
  }

  async updatePreferences(keepForwardedCopy: boolean): Promise<void> {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(
      `Update forwarding preferences for mail account: ${mailAccount.id} keep forwarded copy: ${keepForwardedCopy}`
    )
    await this.repository.update(mailAccount, { keepForwardedCopy })
  }

  private generateVerificationToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    for (let i = 0; i < 32; i++) {
      token += chars[Math.floor(Math.random() * chars.length)]
    }
    return token
  }

  private queueVerificationEmail(
    forwardingEmail: string,
    mailAccountEmail: string,
    verificationLink: string
  ) {
    const notification = new MailForwardingVerificationNotification(
      forwardingEmail,
      mailAccountEmail,
      verificationLink
    )
    this.logger.info(
      `Queue forwarding verification email to: ${forwardingEmail} for mail account: ${mailAccountEmail}`
    )
    this.cronManager.addQueueJob(
      'emails',
      async () => {
        this.logger.info('Send mail forwarding verification email')
        await mail.send(notification)
      },
      { retries: 2, retryDelayMs: 1000 }
    )
  }
}
