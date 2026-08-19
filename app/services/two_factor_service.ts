import TwoFactorStatusAlertNotification from '#mails/two_factor_status_alert_notification'
import MailAccount from '#models/mail_account'
import MailAccountRepository from '#repositories/mail_account_repository'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import encryption from '@adonisjs/core/services/encryption'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import { OTP } from 'otplib'
import { randomBytes } from 'node:crypto'
import CronManager from '../managers/crons_manager.js'

const otp = new OTP({ strategy: 'totp' })
const BACKUP_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
const BACKUP_CODE_COUNT = 10

interface PendingTwoFactorSetup {
  secret: string
  otpauthUrl: string
  backupCodes: string[]
}

@inject()
export class TwoFactorService {
  constructor(
    private readonly repository: MailAccountRepository,
    private readonly logger: Logger,
    private readonly cronManager: CronManager
  ) {}

  async setup(mailAccount: MailAccount): Promise<PendingTwoFactorSetup> {
    await mailAccount.load('domain')
    const mailAccountEmail = `${mailAccount.username}@${mailAccount.domain.name}`

    const secret = otp.generateSecret()
    const otpauthUrl = otp.generateURI({ issuer: 'MarrowMail', label: mailAccountEmail, secret })
    const backupCodes = this.generateBackupCodes()
    const hashedBackupCodes = await Promise.all(backupCodes.map((code) => hash.make(code)))

    // Secret + backup codes are stored now, but two_factor_enabled stays false
    // until enable() confirms the user actually saved the secret.
    await this.repository.update(mailAccount, {
      twoFactorSecret: encryption.encrypt(secret),
      twoFactorBackupCodes: hashedBackupCodes,
    })

    return { secret, otpauthUrl, backupCodes }
  }

  async enable(mailAccount: MailAccount, code: string): Promise<void> {
    if (!mailAccount.twoFactorSecret) throw httpError(400, 'Run two-factor setup first')

    const secret = encryption.decrypt<string>(mailAccount.twoFactorSecret)
    if (!secret || !(await this.verifyTotp(secret, code))) {
      throw httpError(400, 'Invalid verification code')
    }

    await this.repository.update(mailAccount, { twoFactorEnabled: true })
    await mailAccount.load('domain')
    this.queueStatusAlert(mailAccount, true)
  }

  async disable(mailAccount: MailAccount, currentPassword: string, code: string): Promise<void> {
    const isPasswordValid = await hash.verify(mailAccount.password, currentPassword)
    if (!isPasswordValid) throw httpError(400, 'Current password is incorrect')

    await this.assertValidCode(mailAccount, code)

    await this.repository.update(mailAccount, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
    })
    await mailAccount.load('domain')
    this.queueStatusAlert(mailAccount, false)
  }

  /**
   * Verifies a TOTP code, falling back to consuming a backup code. Used both
   * for the login challenge and for disabling 2FA.
   */
  async assertValidCode(mailAccount: MailAccount, code: string): Promise<void> {
    if (!mailAccount.twoFactorSecret) {
      throw httpError(400, 'Two-factor authentication is not enabled')
    }

    const secret = encryption.decrypt<string>(mailAccount.twoFactorSecret)
    if (secret && (await this.verifyTotp(secret, code))) return

    const backupCodes = (mailAccount.twoFactorBackupCodes as string[] | null) ?? []
    for (let i = 0; i < backupCodes.length; i++) {
      if (await hash.verify(backupCodes[i], code)) {
        const remaining = [...backupCodes]
        remaining.splice(i, 1)
        await this.repository.update(mailAccount, { twoFactorBackupCodes: remaining })
        return
      }
    }

    throw httpError(400, 'Invalid verification code')
  }

  /**
   * otp.verify() throws (rather than returning invalid) when the token isn't
   * shaped like a TOTP code — e.g. an 8-character backup code. Treat any
   * such rejection as "not a valid TOTP code" so callers can fall back to
   * checking backup codes instead of crashing.
   */
  private async verifyTotp(secret: string, code: string): Promise<boolean> {
    try {
      const result = await otp.verify({ secret, token: code })
      return result.valid
    } catch {
      return false
    }
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: BACKUP_CODE_COUNT }, () => {
      const bytes = randomBytes(8)
      let code = ''
      for (const byte of bytes) code += BACKUP_CODE_CHARS[byte % BACKUP_CODE_CHARS.length]
      return code
    })
  }

  private queueStatusAlert(mailAccount: MailAccount, enabled: boolean) {
    const mailAccountEmail = `${mailAccount.username}@${mailAccount.domain.name}`
    const recipient = mailAccount.ownerEmail ?? mailAccountEmail
    const notification = new TwoFactorStatusAlertNotification(recipient, mailAccountEmail, enabled)

    this.cronManager.addQueueJob(
      'emails',
      async () => {
        this.logger.info(`Send two-factor ${enabled ? 'enabled' : 'disabled'} alert email`)
        await mail.send(notification)
      },
      { retries: 2, retryDelayMs: 1000 }
    )
  }
}
