import MailAccountPasswordResetAlertNotification from '#mails/mail_account_password_reset_alert_notification'
import MailAccountPasswordResetNotification from '#mails/mail_account_password_reset_notification'
import MailAccount from '#models/mail_account'
import MailAccountRepository from '#repositories/mail_account_repository'
import { TwoFactorService } from '#services/two_factor_service'
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

const TWO_FACTOR_CHALLENGE_PURPOSE = '2fa-challenge'

@inject()
export class AuthMailAccountService {
  constructor(
    private readonly repository: MailAccountRepository,
    private readonly twoFactorService: TwoFactorService,
    private readonly ctx: HttpContext,
    private readonly logger: Logger,
    private readonly cronManager: CronManager
  ) {}

  async getRequestMailAccount(): Promise<MailAccount> {
    const authHeader = this.ctx.request.header('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('Mail account request rejected: missing bearer token')
      throw httpError(401, 'Unauthorized')
    }
    const token = authHeader.slice(7)
    try {
      const payload = jwt.verify(token, env.get('JWT_SECRET', 'key')) as { id: number }
      const mailAccount = await this.repository.findById(payload.id)
      if (!mailAccount) {
        this.logger.warn(`Mail account request rejected for mail account: ${payload.id}: not found`)
        throw httpError(401, 'Unauthorized')
      }
      if (!mailAccount.active) {
        this.logger.warn(
          `Mail account request rejected for mail account: ${mailAccount.id}: mailbox disabled`
        )
        throw httpError(403, 'This mailbox has been disabled')
      }
      return mailAccount
    } catch (error) {
      if (error instanceof Error && 'status' in error) throw error
      this.logger.warn(
        `Mail account request rejected: invalid token: ${error instanceof Error ? error.message : String(error)}`
      )
      throw httpError(401, 'Unauthorized')
    }
  }

  async login(data: { email: string; password: string }) {
    this.logger.info(`Login attempt for mail account email: ${data.email}`)
    const [username, domain] = data.email.split('@')
    const mailAccount = await this.repository.findByUsernameAndDomain(username, domain)
    if (!mailAccount) {
      this.logger.warn(`Login rejected for email: ${data.email}: mail account not found`)
      throw httpError(400, 'Invalid email or password')
    }

    const isPasswordValid = await hash.verify(mailAccount.password, data.password)
    if (!isPasswordValid) {
      this.logger.warn(`Login rejected for mail account: ${mailAccount.id}: invalid password`)
      throw httpError(400, 'Invalid email or password')
    }

    if (!mailAccount.active) {
      this.logger.warn(`Login rejected for mail account: ${mailAccount.id}: mailbox disabled`)
      throw httpError(403, 'This mailbox has been disabled')
    }

    this.logger.info(`Logged in mail account: ${mailAccount.id}`)
    return mailAccount
  }

  async generateJWT(mailAccount: MailAccount) {
    this.logger.info(`Generate JWT for mail account: ${mailAccount.id}`)
    const expiresAt = DateTime.now().plus({ day: 1 }).toISO()
    return {
      token: jwt.sign({ id: mailAccount.id }, env.get('JWT_SECRET', 'key'), { expiresIn: '1d' }),
      expiresAt,
    }
  }

  generateTwoFactorChallenge(mailAccount: MailAccount) {
    this.logger.info(`Generate two-factor challenge for mail account: ${mailAccount.id}`)
    const expiresAt = DateTime.now().plus({ minutes: 5 }).toISO()
    return {
      challengeToken: jwt.sign(
        { id: mailAccount.id, purpose: TWO_FACTOR_CHALLENGE_PURPOSE },
        env.get('JWT_SECRET', 'key'),
        { expiresIn: '5m' }
      ),
      expiresAt,
    }
  }

  async verifyTwoFactorChallenge(challengeToken: string, code: string) {
    let payload: { id: number; purpose: string }
    try {
      payload = jwt.verify(challengeToken, env.get('JWT_SECRET', 'key')) as typeof payload
    } catch {
      this.logger.warn('Two-factor challenge rejected: challenge token expired or invalid')
      throw httpError(401, 'Challenge expired or invalid, please sign in again')
    }
    this.logger.info(`Verify two-factor challenge for mail account: ${payload.id}`)
    if (payload.purpose !== TWO_FACTOR_CHALLENGE_PURPOSE) {
      this.logger.warn(
        `Two-factor challenge rejected for mail account: ${payload.id}: invalid token purpose`
      )
      throw httpError(401, 'Invalid challenge token')
    }

    const mailAccount = await this.repository.findById(payload.id)
    if (!mailAccount) {
      this.logger.warn(`Two-factor challenge rejected for mail account: ${payload.id}: not found`)
      throw httpError(401, 'Invalid challenge token')
    }

    await this.twoFactorService.assertValidCode(mailAccount, code)

    this.logger.info(`Two-factor challenge passed for mail account: ${mailAccount.id}`)
    return this.generateJWT(mailAccount)
  }

  async forgotPassword(email: string) {
    const [username, domainName] = email.toLowerCase().trim().split('@')
    this.logger.info(`Forgot password request for mail account email: ${username}@${domainName}`)
    const mailAccount = await this.repository.findByUsernameAndDomain(username, domainName)
    if (!mailAccount) {
      this.logger.warn(
        `Forgot password rejected for email: ${username}@${domainName}: mail account not found`
      )
      throw httpError(400, 'Mail account does not exist')
    }

    const recipient = mailAccount.ownerEmail
    if (!recipient) {
      this.logger.warn(
        `Forgot password rejected for mail account: ${mailAccount.id}: no recovery email`
      )
      throw httpError(400, 'No recovery email is associated with this mail account')
    }

    const resetPasswordToken = this.generateResetPasswordToken()
    const resetPasswordTokenExpiresAt = DateTime.now().plus({ hours: 1 })

    this.logger.info(`Issue reset password token for mail account: ${mailAccount.id}`)
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
    this.logger.info(`Reset password attempt for mail account email: ${username}@${domainName}`)
    const mailAccount = await this.repository.findByUsernameAndDomainAndResetPasswordToken(
      username,
      domainName,
      data.resetPasswordToken
    )
    if (!mailAccount) {
      this.logger.warn(
        `Reset password rejected for email: ${username}@${domainName}: invalid token`
      )
      return false
    }
    if (
      mailAccount.resetPasswordTokenExpiresAt &&
      mailAccount.resetPasswordTokenExpiresAt < DateTime.now()
    ) {
      this.logger.warn(`Reset password rejected for mail account: ${mailAccount.id}: token expired`)
      return false
    }

    await this.repository.update(mailAccount, {
      password: await hash.make(data.newPassword),
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
    })
    this.logger.info(`Reset password for mail account: ${mailAccount.id}`)

    await mailAccount.load('domain')
    const mailAccountEmail = `${mailAccount.username}@${mailAccount.domain.name}`
    const recipient = mailAccount.ownerEmail ?? mailAccountEmail
    this.sendPasswordResetAlertNotification(recipient, mailAccountEmail)

    return true
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const mailAccount = await this.getRequestMailAccount()
    this.logger.info(`Change password attempt for mail account: ${mailAccount.id}`)

    const isCurrentPasswordValid = await hash.verify(mailAccount.password, currentPassword)
    if (!isCurrentPasswordValid) {
      this.logger.warn(
        `Change password rejected for mail account: ${mailAccount.id}: incorrect current password`
      )
      throw httpError(400, 'Current password is incorrect')
    }

    await this.repository.update(mailAccount, {
      password: await hash.make(newPassword),
    })
    this.logger.info(`Changed password for mail account: ${mailAccount.id}`)

    await mailAccount.load('domain')
    const mailAccountEmail = `${mailAccount.username}@${mailAccount.domain.name}`
    const recipient = mailAccount.ownerEmail ?? mailAccountEmail
    this.sendPasswordResetAlertNotification(recipient, mailAccountEmail)
  }

  async profile() {
    const mailAccount = await this.getRequestMailAccount()
    this.logger.info(`Fetch profile for mail account: ${mailAccount.id}`)
    await mailAccount.load('profile')
    if (!mailAccount.profile) return null

    return {
      ...mailAccount.profile.serialize(),
      twoFactorEnabled: mailAccount.twoFactorEnabled,
      forwardingEmail: mailAccount.forwardingEmail,
      forwardingVerified: mailAccount.forwardingVerified,
      keepForwardedCopy: mailAccount.keepForwardedCopy,
    }
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
    this.logger.info(
      `Queue password reset email for mail account: ${mailAccountEmail} recipient: ${recipient}`
    )
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
    this.logger.info(
      `Queue password reset alert email for mail account: ${mailAccountEmail} recipient: ${recipient}`
    )
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
