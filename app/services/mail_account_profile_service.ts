import MailAccountProfileSetupedNotification from '#mails/mail_account_profile_setuped_notification'
import MailAccount from '#models/mail_account'
import MailAccountProfile from '#models/mail_account_profile'
import MailAccountProfileRepository from '#repositories/mail_account_profile_repository'
import MailAccountRepository from '#repositories/mail_account_repository'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { Logger } from '@adonisjs/core/logger'
import mail from '@adonisjs/mail/services/main'
import CronManager from '../managers/crons_manager.js'

interface SetupMailAccountProfilePayload {
  firstName: string
  lastName: string
  avatar?: string | null
  mailAccountId: number
}

@inject()
export class MailAccountProfileService {
  constructor(
    private readonly repository: MailAccountProfileRepository,
    private readonly mailAccountRepository: MailAccountRepository,
    private readonly ctx: HttpContext,
    private readonly logger: Logger,
    private readonly cronManager: CronManager
  ) {}

  async getProfile(mailAccountId: number): Promise<MailAccountProfile> {
    const mailAccount = await this.mailAccountRepository.findById(mailAccountId)
    if (!mailAccount) throw httpError(404, 'Mail account not found')

    if (mailAccount.userId !== this.ctx.auth.user!.id) {
      throw httpError(403, 'You are not allowed to access this mail account')
    }

    const profile = await this.repository.findByMailAccountId(mailAccountId)
    if (!profile) throw httpError(404, 'Profile not found')

    return profile
  }

  async setupMailAccountProfile(
    mailAccount: MailAccount,
    data: SetupMailAccountProfilePayload
  ): Promise<MailAccountProfile> {
    const existing = await this.repository.findByMailAccountId(data.mailAccountId)

    let profile: MailAccountProfile
    if (existing) {
      profile = await this.repository.update(existing, {
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar ?? null,
      })
    } else {
      profile = await this.repository.create({
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar ?? null,
        mailAccountId: data.mailAccountId,
      })
    }

    if (mailAccount.ownerEmail) {
      await mailAccount.load('domain')
      this.queueMailAccountProfileSetupedNotification(mailAccount, profile)
    }

    return profile
  }

  async findByMailAccountId(mailAccountId: number): Promise<MailAccountProfile | null> {
    return this.repository.findByMailAccountId(mailAccountId)
  }

  async deleteProfile(profile: MailAccountProfile): Promise<void> {
    await this.repository.delete(profile)
  }

  private queueMailAccountProfileSetupedNotification(
    mailAccount: MailAccount,
    profile: MailAccountProfile
  ) {
    const mailAccountEmail = `${mailAccount.username}@${mailAccount.domain.name}`
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
