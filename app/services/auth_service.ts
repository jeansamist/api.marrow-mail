import { UserSchema } from '#database/schema'
import EmailVerificationCodeNotification from '#mails/email_verification_code_notification'
import LoginAlertNotification from '#mails/login_alert_notification'
import PasswordResetAlertNotification from '#mails/password_reset_alert_notification'
import PasswordResetNotification from '#mails/password_reset_notification'
import WelcomeNotification from '#mails/welcome_notification'
import User from '#models/user'
import UserRepository from '#repositories/user_repository'
import env from '#start/env'
import { ModelProps } from '#utils/generics'
import { httpError } from '#utils/http_error'
import { Authenticator } from '@adonisjs/auth'
import { Authenticators } from '@adonisjs/auth/types'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import { randomInt } from 'node:crypto'
import CronManager from '../managers/crons_manager.js'

@inject()
export class AuthService {
  // Your code here
  constructor(
    protected readonly userRepository: UserRepository,
    protected readonly cronManager: CronManager,
    protected readonly logger: Logger
  ) {}

  generateVerificationCode() {
    return randomInt(100000, 1000000).toString()
  }

  async signUp(
    data: Pick<ModelProps<User>, 'firstName' | 'lastName' | 'email' | 'password'> & {
      businessName?: string
    }
  ) {
    this.logger.info(`Sign up attempt for email: ${data.email}`)
    const verificationCode = this.generateVerificationCode()
    const verificationCodeExpiresAt = DateTime.now().plus({ hours: 1 })
    const normalizedData = { ...data, businessName: data.businessName ?? null }
    const restOfData = {
      avatar: null,
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpiresAt: verificationCodeExpiresAt,
      emailVerified: false,
      emailVerifiedAt: null,
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
    } satisfies Omit<
      ModelProps<UserSchema>,
      'firstName' | 'lastName' | 'email' | 'password' | 'businessName'
    >
    const existingUser = await this.userRepository.findByEmail(data.email)
    if (existingUser) {
      if (existingUser.emailVerified) {
        this.logger.warn(`Sign up rejected for email: ${data.email}: email already taken`)
        throw httpError(409, 'Email has already been taken')
      }
      // Update the unverified user and resend the verification code
      this.logger.info(`Resend verification code to unverified user: ${existingUser.id}`)
      await this.userRepository.update(existingUser, { ...normalizedData, ...restOfData })
      this.sendEmailVerificationCodeNotification(existingUser)
      return { user: existingUser, isNewAccount: false }
    }
    let user: User
    try {
      user = await this.userRepository.create({ ...normalizedData, ...restOfData })
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        // Two concurrent signups for the same new email raced past the check above;
        // the DB unique constraint is the actual source of truth here.
        this.logger.warn(
          `Sign up rejected for email: ${data.email}: email already taken (unique constraint)`
        )
        throw httpError(409, 'Email has already been taken')
      }
      this.logger.error(
        `Failed to create user for email: ${data.email}: ${error instanceof Error ? error.message : String(error)}`
      )
      throw error
    }
    this.logger.info(`Created user: ${user.id} email: ${user.email}`)
    this.sendEmailVerificationCodeNotification(user)
    return { user, isNewAccount: true }
  }

  async signIn(data: Pick<ModelProps<User>, 'email' | 'password'>) {
    this.logger.info(`Sign in attempt for email: ${data.email}`)
    const user = await User.verifyCredentials(data.email, data.password)
    // Check if email is verified
    if (!user.emailVerified) {
      this.logger.warn(`Sign in rejected for user: ${user.id}: email not verified`)
      throw httpError(
        403,
        'Please verify your email address before signing in. Check your email for the verification code.'
      )
    }
    this.logger.info(`Signed in user: ${user.id}`)
    this.sendLoginAlertNotification(user)
    return user
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim()
    this.logger.info(`Forgot password request for email: ${normalizedEmail}`)
    const user = await User.findBy('email', normalizedEmail)
    if (!user) {
      this.logger.warn(`Forgot password rejected for email: ${normalizedEmail}: user not found`)
      throw httpError(400, 'User does not exist')
    }
    const resetPasswordToken = this.generateResetPasswordToken()
    const resetPasswordTokenExpiresAt = DateTime.now().plus({ hours: 1 })

    this.logger.info(`Issue reset password token for user: ${user.id}`)
    this.sendPasswordResetEmail(
      await this.userRepository.update(user, {
        resetPasswordToken,
        resetPasswordTokenExpiresAt,
      })
    )
  }

  async resetPassword(data: { email: string; resetPasswordToken: string; newPassword: string }) {
    this.logger.info(`Reset password attempt for email: ${data.email}`)
    const user = await this.userRepository.findByEmailAndResetPasswordToken(
      data.email,
      data.resetPasswordToken
    )
    if (!user) {
      this.logger.warn(`Reset password rejected for email: ${data.email}: invalid token`)
      return false
    }
    if (user.resetPasswordTokenExpiresAt && user.resetPasswordTokenExpiresAt < DateTime.now()) {
      this.logger.warn(`Reset password rejected for user: ${user.id}: token expired`)
      return false
    }
    await this.userRepository.update(user, {
      password: data.newPassword,
    })
    await this.wipeResetPasswordToken(user)
    this.logger.info(`Reset password for user: ${user.id}`)
    this.sendPasswordResetAlertNotification(user)
    return true
  }

  async deleteAccount(user: User) {
    this.logger.info(`Delete account for user: ${user.id}`)
    return this.userRepository.delete(user)
  }

  async updateProfile(user: User, payload: Partial<ModelProps<User>>) {
    this.logger.info(
      `Update profile for user: ${user.id} fields: ${Object.keys(payload).join(', ')}`
    )
    return this.userRepository.update(user, payload)
  }

  generateResetPasswordToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    for (let i = 0; i < 32; i++) {
      token += chars[Math.floor(Math.random() * chars.length)]
    }
    return token
  }

  sendPasswordResetEmail(user: User) {
    this.logger.info(`Queue password reset email for user: ${user.id}`)
    const resetPasswordLink =
      env.get('FRONTEND_APP_URL') +
      `/en/reset-password?email=${encodeURIComponent(user.email)}&resetPasswordToken=${user.resetPasswordToken}`
    const notification = new PasswordResetNotification(user, resetPasswordLink)

    this.cronManager.addQueueJob(
      'emails',
      async () => {
        this.logger.info('Send reset password email')
        await mail.send(notification)
      },
      { retries: 2, retryDelayMs: 1000 }
    )
  }

  sendPasswordResetAlertNotification(user: User) {
    this.logger.info(`Queue password reset alert email for user: ${user.id}`)
    const notification = new PasswordResetAlertNotification(
      user,
      `${DateTime.now().toUTC().toFormat('yyyy-LL-dd HH:mm:ss')} UTC`
    )
    this.cronManager.addQueueJob(
      'emails',
      async () => {
        this.logger.info('Send password reset alert email')
        await mail.send(notification)
      },
      { retries: 2, retryDelayMs: 1000 }
    )
  }

  sendEmailVerificationCodeNotification(user: User) {
    this.logger.info(`Queue email verification code email for user: ${user.id}`)
    const notification = new EmailVerificationCodeNotification(user)
    this.cronManager.addQueueJob(
      'emails',
      async () => {
        this.logger.info('Send email verification code email')
        await mail.send(notification)
      },
      { retries: 2, retryDelayMs: 1000 }
    )
  }

  sendWelcomeNotification(user: User) {
    this.logger.info(`Queue welcome email for user: ${user.id}`)
    const notification = new WelcomeNotification(user)
    this.cronManager.addQueueJob(
      'emails',
      async () => {
        this.logger.info('Send welcome email')
        await mail.send(notification)
      },
      { retries: 2, retryDelayMs: 1000 }
    )
  }

  sendLoginAlertNotification(user: User) {
    this.logger.info(`Queue login alert email for user: ${user.id}`)
    const notification = new LoginAlertNotification(
      user,
      `${DateTime.now().toUTC().toFormat('yyyy-LL-dd HH:mm:ss')} UTC`
    )
    this.cronManager.addQueueJob(
      'emails',
      async () => {
        this.logger.info('Send login alert email')
        await mail.send(notification)
      },
      { retries: 2, retryDelayMs: 1000 }
    )
  }

  /**
   * Generate access token for a user
   */
  async generateAccessToken(user: User, auth: Authenticator<Authenticators>) {
    this.logger.info(`Generate access token for user: ${user.id}`)
    return await auth.use('api').createToken(user, ['*'], { expiresIn: '30d' })
  }

  /**
   * Delete/invalidate access token
   */
  async deleteAccessToken(auth: Authenticator<Authenticators>) {
    this.logger.info(`Invalidate access token for user: ${auth.use('api').user?.id ?? 'unknown'}`)
    return await auth.use('api').invalidateToken()
  }

  async verifyEmail(email: string, emailVerificationCode: string) {
    this.logger.info(`Verify email attempt for email: ${email}`)
    const user = await this.userRepository.findByEmailAndEmailVerificationCode(
      email,
      emailVerificationCode
    )
    if (!user) {
      this.logger.warn(`Email verification rejected for email: ${email}: invalid code`)
      return false
    }
    if (
      user.emailVerificationCodeExpiresAt &&
      user.emailVerificationCodeExpiresAt < DateTime.now()
    ) {
      this.logger.warn(`Email verification rejected for user: ${user.id}: code expired`)
      return false
    }
    await this.userRepository.update(user, {
      emailVerified: true,
      emailVerifiedAt: DateTime.now(),
    })
    await this.wipeEmailVerificationCode(user)
    this.logger.info(`Verified email for user: ${user.id}`)
    this.sendWelcomeNotification(user)
    return user
  }

  async wipeResetPasswordToken(user: User) {
    this.logger.info(`Wipe reset password token for user: ${user.id}`)
    await this.userRepository.update(user, {
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
    })
  }
  async wipeEmailVerificationCode(user: User) {
    this.logger.info(`Wipe email verification code for user: ${user.id}`)
    await this.userRepository.update(user, {
      emailVerificationCode: null,
      emailVerificationCodeExpiresAt: null,
    })
  }
}
