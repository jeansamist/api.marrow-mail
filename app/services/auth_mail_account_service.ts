import MailAccountPasswordResetAlertNotification from '#mails/mail_account_password_reset_alert_notification'
import MailAccountPasswordResetNotification from '#mails/mail_account_password_reset_notification'
import MailAccount from '#models/mail_account'
import MailAccountRepository from '#repositories/mail_account_repository'
import env from '#start/env'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { Logger } from '@adonisjs/core/logger'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import jwt from 'jsonwebtoken'
import { DateTime } from 'luxon'
import CronManager from '../managers/crons_manager.js'

@inject()
export class AuthMailAccountService {
  constructor(
    private readonly repository: MailAccountRepository,
    private readonly ctx: HttpContext,
    private readonly logger: Logger,
    private readonly cronManager: CronManager
  ) {}

  async getRequestMailAccount(): Promise<MailAccount> {
    const authHeader = this.ctx.request.header('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw httpError(401, 'Unauthorized')
    }
    const token = authHeader.slice(7)
    try {
      const payload = jwt.verify(token, env.get('JWT_SECRET', 'key')) as { id: number }
      const mailAccount = await this.repository.findById(payload.id)
      if (!mailAccount) throw httpError(401, 'Unauthorized')
      return mailAccount
    } catch {
      throw httpError(401, 'Unauthorized')
    }
  }

  async login(data: { email: string; password: string }) {
    const [username, domain] = data.email.split('@')
    const mailAccount = await this.repository.findByUsernameAndDomain(username, domain)
    if (!mailAccount) throw httpError(400, 'Invalid email or password')

    const isPasswordValid = await hash.verify(mailAccount.password, data.password)
    if (!isPasswordValid) throw httpError(400, 'Invalid email or password')

    return mailAccount
  }

  async generateJWT(mailAccount: MailAccount) {
    const expiresAt = DateTime.now().plus({ day: 1 }).toISO()
    return {
      token: jwt.sign({ id: mailAccount.id }, env.get('JWT_SECRET', 'key'), { expiresIn: '1d' }),
      expiresAt,
    }
  }

  async forgotPassword(email: string) {
    const [username, domainName] = email.toLowerCase().trim().split('@')
    const mailAccount = await this.repository.findByUsernameAndDomain(username, domainName)
    if (!mailAccount) throw httpError(400, 'Mail account does not exist')

    const recipient = mailAccount.ownerEmail
    if (!recipient) throw httpError(400, 'No recovery email is associated with this mail account')

    const resetPasswordToken = this.generateResetPasswordToken()
    const resetPasswordTokenExpiresAt = DateTime.now().plus({ hours: 1 })

    await this.repository.update(mailAccount, {
      resetPasswordToken,
      resetPasswordTokenExpiresAt,
    })

    await mailAccount.load('domain')
    const mailAccountEmail = `${mailAccount.username}@${mailAccount.domain.name}`
    const resetPasswordLink =
      env.get('FRONTEND_APP_URL') +
      `/mail-auth/reset-password?email=${encodeURIComponent(mailAccountEmail)}&resetPasswordToken=${resetPasswordToken}`

    this.sendPasswordResetEmail(recipient, mailAccountEmail, resetPasswordLink)
  }

  async resetPassword(data: { email: string; resetPasswordToken: string; newPassword: string }) {
    const [username, domainName] = data.email.toLowerCase().trim().split('@')
    const mailAccount = await this.repository.findByUsernameAndDomainAndResetPasswordToken(
      username,
      domainName,
      data.resetPasswordToken
    )
    if (!mailAccount) return false
    if (
      mailAccount.resetPasswordTokenExpiresAt &&
      mailAccount.resetPasswordTokenExpiresAt < DateTime.now()
    ) {
      return false
    }

    await this.repository.update(mailAccount, {
      password: await hash.make(data.newPassword),
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
    })

    await mailAccount.load('domain')
    const mailAccountEmail = `${mailAccount.username}@${mailAccount.domain.name}`
    const recipient = mailAccount.ownerEmail ?? mailAccountEmail
    this.sendPasswordResetAlertNotification(recipient, mailAccountEmail)

    return true
  }

  async profile() {
    const mailAccount = await this.getRequestMailAccount()
    await mailAccount.load('profile')
    return mailAccount.profile ?? null
  }

  generateResetPasswordToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    for (let i = 0; i < 32; i++) {
      token += chars[Math.floor(Math.random() * chars.length)]
    }
    return token
  }

  private sendPasswordResetEmail(
    recipient: string,
    mailAccountEmail: string,
    resetPasswordLink: string
  ) {
    const notification = new MailAccountPasswordResetNotification(
      recipient,
      mailAccountEmail,
      resetPasswordLink
    )
    this.cronManager.addQueueJob(
      'emails',
      async () => {
        this.logger.info('Send mail account reset password email')
        await mail.send(notification)
      },
      { retries: 2, retryDelayMs: 1000 }
    )
  }

  private sendPasswordResetAlertNotification(recipient: string, mailAccountEmail: string) {
    const notification = new MailAccountPasswordResetAlertNotification(
      recipient,
      mailAccountEmail,
      `${DateTime.now().toUTC().toFormat('yyyy-LL-dd HH:mm:ss')} UTC`
    )
    this.cronManager.addQueueJob(
      'emails',
      async () => {
        this.logger.info('Send mail account password reset alert email')
        await mail.send(notification)
      },
      { retries: 2, retryDelayMs: 1000 }
    )
  }
}
