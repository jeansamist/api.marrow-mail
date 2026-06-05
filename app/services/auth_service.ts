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

  async signUp(data: Pick<ModelProps<User>, 'firstName' | 'lastName' | 'email' | 'password'>) {
    const verificationCode = this.generateVerificationCode()
    const verificationCodeExpiresAt = DateTime.now().plus({ hours: 1 })
    const restOfData = {
      avatar: null,
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpiresAt: verificationCodeExpiresAt,
      emailVerified: false,
      emailVerifiedAt: null,
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
    } satisfies Omit<ModelProps<UserSchema>, 'firstName' | 'lastName' | 'email' | 'password'>
    const existingUser = await this.userRepository.findByEmail(data.email)
    if (existingUser) {
      if (existingUser.emailVerified) {
        throw new Error('Email has already been taken')
      }
      // Update the unverified user
      await this.userRepository.update(existingUser, { ...data, ...restOfData })
      return existingUser
    }
    const user = await this.userRepository.create({ ...data, ...restOfData })
    this.sendEmailVerificationCodeNotification(user)
    return user
  }

  async signIn(data: Pick<ModelProps<User>, 'email' | 'password'>) {
    const user = await User.verifyCredentials(data.email, data.password)
    // Check if email is verified
    if (!user.emailVerified) {
      throw new Error(
        'Please verify your email address before signing in. Check your email for the verification code.'
      )
    }
    this.sendLoginAlertNotification(user)
    return user
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim()
    const user = await User.findBy('email', normalizedEmail)
    if (!user) {
      throw new Error('User does not exist')
    }
    const resetPasswordToken = this.generateResetPasswordToken()
    const resetPasswordTokenExpiresAt = DateTime.now().plus({ hours: 1 })

    this.sendPasswordResetEmail(
      await this.userRepository.update(user, {
        resetPasswordToken,
        resetPasswordTokenExpiresAt,
      })
    )
  }

  async resetPassword(data: { email: string; resetPasswordToken: string; newPassword: string }) {
    const user = await this.userRepository.findByEmailAndResetPasswordToken(
      data.email,
      data.resetPasswordToken
    )
    if (!user) return false
    if (user.resetPasswordTokenExpiresAt && user.resetPasswordTokenExpiresAt < DateTime.now()) {
      return false
    }
    await this.userRepository.update(user, {
      password: data.newPassword,
    })
    await this.wipeResetPasswordToken(user)
    this.sendPasswordResetAlertNotification(user)
    return true
  }

  async deleteAccount(user: User) {
    return this.userRepository.delete(user)
  }

  async updateProfile(user: User, payload: Partial<ModelProps<User>>) {
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
    const resetPasswordLink =
      env.get('FRONTEND_APP_URL') +
      `/auth/reset-password?email=${encodeURIComponent(user.email)}&resetPasswordToken=${user.resetPasswordToken}`
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
    return await auth.use('api').createToken(user, ['*'], { expiresIn: '30d' })
  }

  /**
   * Delete/invalidate access token
   */
  async deleteAccessToken(auth: Authenticator<Authenticators>) {
    return await auth.use('api').invalidateToken()
  }

  async verifyEmail(email: string, emailVerificationCode: string) {
    const user = await this.userRepository.findByEmailAndEmailVerificationCode(
      email,
      emailVerificationCode
    )
    if (!user) return false
    if (
      user.emailVerificationCodeExpiresAt &&
      user.emailVerificationCodeExpiresAt < DateTime.now()
    ) {
      return false
    }
    await this.userRepository.update(user, {
      emailVerified: true,
      emailVerifiedAt: DateTime.now(),
    })
    await this.wipeEmailVerificationCode(user)
    this.sendWelcomeNotification(user)
    return user
  }

  async wipeResetPasswordToken(user: User) {
    await this.userRepository.update(user, {
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
    })
  }
  async wipeEmailVerificationCode(user: User) {
    await this.userRepository.update(user, {
      emailVerificationCode: null,
      emailVerificationCodeExpiresAt: null,
    })
  }
}
