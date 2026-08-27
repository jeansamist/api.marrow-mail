import MailAccountProfileSetupedNotification from '#mails/mail_account_profile_setuped_notification'
import MailAccount from '#models/mail_account'
import MailAccountProfile from '#models/mail_account_profile'
import MailAccountProfileRepository from '#repositories/mail_account_profile_repository'
import MailAccountRepository from '#repositories/mail_account_repository'
import { AuthMailAccountService } from '#services/auth_mail_account_service'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { Logger } from '@adonisjs/core/logger'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import CronManager from '../managers/crons_manager.js'

interface SetupMailAccountProfilePayload {
  firstName: string
  lastName: string
  avatar: string | null
  newPassword: string
}

interface UpdateMailAccountProfilePayload {
  firstName?: string
  lastName?: string
  avatar?: string | null
}

@inject()
export class MailAccountProfileService {
  constructor(
    private readonly repository: MailAccountProfileRepository,
    private readonly mailAccountRepository: MailAccountRepository,
    private readonly authMailAccountService: AuthMailAccountService,
    private readonly ctx: HttpContext,
    private readonly logger: Logger,
    private readonly cronManager: CronManager
  ) {}

  async getProfile(mailAccountId: number): Promise<MailAccountProfile> {
    this.logger.info(
      `Fetch profile for mail account: ${mailAccountId} user: ${this.ctx.auth.user?.id ?? 'unknown'}`
    )
    const mailAccount = await this.mailAccountRepository.findById(mailAccountId)
    if (!mailAccount) {
      this.logger.warn(
        `Profile fetch rejected for mail account: ${mailAccountId}: mail account not found`
      )
      throw httpError(404, 'Mail account not found')
    }

    if (mailAccount.userId !== this.ctx.auth.user!.id) {
      this.logger.warn(
        `Profile fetch rejected for mail account: ${mailAccountId} user: ${this.ctx.auth.user!.id}: not owner`
      )
      throw httpError(403, 'You are not allowed to access this mail account')
    }

    const profile = await this.repository.findByMailAccountId(mailAccountId)
    if (!profile) {
      this.logger.warn(
        `Profile fetch rejected for mail account: ${mailAccountId}: profile not found`
      )
      throw httpError(404, 'Profile not found')
    }

    return profile
  }

  async setupMailAccountProfile(
    mailAccount: MailAccount,
    data: SetupMailAccountProfilePayload
  ): Promise<MailAccountProfile> {
    this.logger.info(`Set up profile for mail account: ${mailAccount.id}`)
    // destructre the data payload
    const { newPassword, ...profileData } = data

    // create a mail account profile
    const profile = await this.repository.create({
      ...profileData,
      mailAccountId: mailAccount.id,
    })
    this.logger.info(`Created profile: ${profile.id} for mail account: ${mailAccount.id}`)

    // hash the user new mail account password provided
    const hashedPassword = await hash.make(newPassword)

    // Update the mail account to status setuped wit te new password
    await this.mailAccountRepository.update(mailAccount, {
      setuped: true,
      password: hashedPassword,
    })
    this.logger.info(`Marked mail account: ${mailAccount.id} as setuped`)

    // Send setup notification email
    if (mailAccount.ownerEmail) {
      await mailAccount.load('domain')
      this.queueMailAccountProfileSetupedNotification(mailAccount, profile)
    }

    return profile
  }

  async updateProfile(data: UpdateMailAccountProfilePayload): Promise<MailAccountProfile> {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(
      `Update profile for mail account: ${mailAccount.id} fields: ${Object.keys(data).join(', ')}`
    )
    const profile = await this.repository.findByMailAccountId(mailAccount.id)
    if (!profile) {
      this.logger.warn(
        `Profile update rejected for mail account: ${mailAccount.id}: profile not found`
      )
      throw httpError(404, 'Profile not found')
    }

    return this.repository.update(profile, {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.avatar !== undefined && { avatar: data.avatar }),
    })
  }

  async findByMailAccountId(mailAccountId: number): Promise<MailAccountProfile | null> {
    this.logger.info(`Find profile for mail account: ${mailAccountId}`)
    return this.repository.findByMailAccountId(mailAccountId)
  }

  async deleteProfile(profile: MailAccountProfile): Promise<void> {
    this.logger.info(`Delete profile: ${profile.id} for mail account: ${profile.mailAccountId}`)
    await this.repository.delete(profile)
  }

  private queueMailAccountProfileSetupedNotification(
    mailAccount: MailAccount,
    profile: MailAccountProfile
  ) {
    const mailAccountEmail = `${mailAccount.username}@${mailAccount.domain.name}`
    this.logger.info(
      `Queue profile setuped notification for mail account: ${mailAccountEmail} recipient: ${mailAccount.ownerEmail}`
    )
    const notification = new MailAccountProfileSetupedNotification(
      mailAccount.ownerEmail!,
      mailAccountEmail,
      profile.firstName
    )

    this.cronManager.addQueueJob(
      'emails',
      async () => {
        this.logger.info('Send mail account profile setuped notification')
        await mail.send(notification)
      },
      { retries: 2, retryDelayMs: 1000 }
    )
  }
}
