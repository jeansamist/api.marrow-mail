import MailAccountCreatedNotification from '#mails/mail_account_created_notification'
import MailAccountsCreatedBatchNotification from '#mails/mail_accounts_created_batch_notification'
import MailAccount from '#models/mail_account'
import MailAccountRepository from '#repositories/mail_account_repository'
import env from '#start/env'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { Logger } from '@adonisjs/core/logger'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import CronManager from '../managers/crons_manager.js'
interface MailAccountPayload {
  username: string
  password: string
  ownerEmail: string | null
  domainId: number
}

type SetupEmailAddressPayload = {
  data: { username: string; owner: string }[]
  domainId: number
}

@inject()
export class MailAccountService {
  constructor(
    private readonly repository: MailAccountRepository,
    private readonly ctx: HttpContext,
    private readonly logger: Logger,
    private readonly cronManager: CronManager
  ) {}

  private get userId() {
    return this.ctx.auth.user!.id
  }

  async findById(id: number): Promise<MailAccount | null> {
    this.logger.info(`Find mail account: ${id}`)
    return this.repository.findById(id)
  }

  async findMailAccountByCuid(cuid: string) {
    this.logger.info('Find mail account by cuid')
    return this.repository.findByCuid(cuid)
  }
  async findMailAccountByCuidOrFail(cuid: string) {
    const mailAccount = await this.findMailAccountByCuid(cuid)
    if (!mailAccount) {
      this.logger.warn('Mail account lookup rejected: no mail account matches the provided cuid')
      throw httpError(400, 'Mail account not found by CUID')
    }
    this.logger.info(`Found mail account: ${mailAccount.id} by cuid`)
    return mailAccount
  }

  checkOwnership(mailAccount: MailAccount) {
    if (mailAccount.userId !== this.userId) {
      this.logger.warn(
        `Ownership check rejected for mail account: ${mailAccount.id} user: ${this.userId}: not owner`
      )
      throw httpError(403, 'You are not allowed to access this mail account')
    }
  }

  async countForCurrentUser(): Promise<number> {
    this.logger.info(`Count mail accounts for user: ${this.userId}`)
    return this.repository.countByUserId(this.userId)
  }

  async listMailAccountsForCurrentUser(): Promise<MailAccount[]> {
    this.logger.info(`List mail accounts for user: ${this.userId}`)
    return this.repository.findAllByUserId(this.userId)
  }

  async deleteMailAccount(id: number): Promise<void> {
    this.logger.info(`Delete mail account: ${id} for user: ${this.userId}`)
    const mailAccount = await this.repository.findById(id)
    if (!mailAccount) {
      this.logger.warn(`Delete rejected for mail account: ${id}: not found`)
      throw httpError(404, 'Mail account not found')
    }
    this.checkOwnership(mailAccount)
    await this.repository.delete(mailAccount)
    this.logger.info(`Deleted mail account: ${id}`)
  }

  async toggleActive(id: number): Promise<MailAccount> {
    this.logger.info(`Toggle active for mail account: ${id} for user: ${this.userId}`)
    const mailAccount = await this.repository.findById(id)
    if (!mailAccount) {
      this.logger.warn(`Toggle active rejected for mail account: ${id}: not found`)
      throw httpError(404, 'Mail account not found')
    }
    this.checkOwnership(mailAccount)
    this.logger.info(`Set mail account: ${mailAccount.id} active: ${!mailAccount.active}`)
    return this.repository.update(mailAccount, { active: !mailAccount.active })
  }

  async resendInvite(id: number): Promise<void> {
    this.logger.info(`Resend invite for mail account: ${id} for user: ${this.userId}`)
    const mailAccount = await this.repository.findById(id)
    if (!mailAccount) {
      this.logger.warn(`Resend invite rejected for mail account: ${id}: not found`)
      throw httpError(404, 'Mail account not found')
    }
    this.checkOwnership(mailAccount)
    if (!mailAccount.ownerEmail) {
      this.logger.warn(`Resend invite rejected for mail account: ${mailAccount.id}: no owner email`)
      throw httpError(400, 'This mail account has no owner email to send the invite to')
    }
    await mailAccount.load('domain')
    this.queueMailAccountCreatedNotification(mailAccount, mailAccount.ownerEmail)
  }

  private queueMailAccountCreatedNotification(mailAccount: MailAccount, ownerEmail: string) {
    const mailAccountEmail = `${mailAccount.username}@${mailAccount.domain.name}`
    const setupLink = `${env.get('FRONTEND_APP_URL')}/en/domain/${mailAccount.domain.name}/setup-profile?cuid=${mailAccount.cuid}`
    this.logger.info(
      `Queue mail account created notification for mail account: ${mailAccountEmail} recipient: ${ownerEmail}`
    )
    const notification = new MailAccountCreatedNotification(ownerEmail, mailAccountEmail, setupLink)

    this.cronManager.addQueueJob(
      'emails',
      async () => {
        this.logger.info('Send mail account created notification')
        await mail.send(notification)
      },
      { retries: 2, retryDelayMs: 1000 }
    )
  }

  /**
   * One consolidated email per owner listing every mailbox they were just
   * assigned, instead of a separate email per mailbox — bulk-creating N
   * unassigned mailboxes (which all default to the account owner's own
   * email) used to flood that owner with N near-identical emails.
   */
  private queueMailAccountsCreatedBatchNotification(ownerEmail: string, accounts: MailAccount[]) {
    const entries = accounts.map((account) => ({
      mailAccountEmail: `${account.username}@${account.domain.name}`,
      setupLink: `${env.get('FRONTEND_APP_URL')}/en/domain/${account.domain.name}/setup-profile?cuid=${account.cuid}`,
    }))
    this.logger.info(
      `Queue batch mail accounts created notification for recipient: ${ownerEmail} accounts: ${entries.length}`
    )
    const notification = new MailAccountsCreatedBatchNotification(ownerEmail, entries)

    this.cronManager.addQueueJob(
      'emails',
      async () => {
        this.logger.info(
          `Send batch mail accounts created notification (${entries.length} accounts)`
        )
        await mail.send(notification)
      },
      { retries: 2, retryDelayMs: 1000 }
    )
  }

  async createMailAccount(data: MailAccountPayload): Promise<MailAccount> {
    this.logger.info(
      `Create mail account: ${data.username} domain: ${data.domainId} for user: ${this.userId}`
    )
    const hashedPassword = await hash.make(data.password)
    const cuid = this.randText({
      length: 20,
      uppercase: false,
      chunks: { separator: '-', size: 5 },
    })
    const mailAccount = await this.repository.create({
      ...data,
      userId: this.userId,
      password: hashedPassword,
      cuid,
      setuped: false,
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
      forwardingEmail: null,
      forwardingVerified: false,
      forwardingVerificationToken: null,
      forwardingVerificationTokenExpiresAt: null,
      keepForwardedCopy: true,
      twoFactorSecret: null,
      twoFactorEnabled: false,
      twoFactorBackupCodes: null,
      active: true,
      storageQuotaBytes: null,
    })
    this.logger.info(`Created mail account: ${mailAccount.id}`)

    if (data.ownerEmail) {
      await mailAccount.load('domain')
      this.queueMailAccountCreatedNotification(mailAccount, data.ownerEmail)
    }

    return mailAccount
  }

  async createManyMailAccount(data: MailAccountPayload[]) {
    this.logger.info(`Create ${data.length} mail accounts for user: ${this.userId}`)
    const hashedData = await Promise.all(
      data.map(async (item) => {
        const cuid = this.randText({
          length: 20,
          uppercase: false,
          chunks: { separator: '-', size: 5 },
        })
        const password = await hash.make(item.password)
        return {
          ...item,
          password,
          userId: this.userId,
          cuid,
          setuped: false,
          resetPasswordToken: null,
          resetPasswordTokenExpiresAt: null,
          forwardingEmail: null,
          forwardingVerified: false,
          forwardingVerificationToken: null,
          forwardingVerificationTokenExpiresAt: null,
          keepForwardedCopy: true,
          twoFactorSecret: null,
          twoFactorEnabled: false,
          twoFactorBackupCodes: null,
          active: true,
          storageQuotaBytes: null,
        }
      })
    )
    const mailAccounts = await this.repository.createMany(hashedData)
    this.logger.info(`Created ${mailAccounts.length} mail accounts for user: ${this.userId}`)

    const accountsByOwnerEmail = new Map<string, MailAccount[]>()
    for (const account of mailAccounts) {
      const ownerEmail = data.find((d) => d.username === account.username)?.ownerEmail
      if (!ownerEmail) continue
      accountsByOwnerEmail.set(ownerEmail, [
        ...(accountsByOwnerEmail.get(ownerEmail) ?? []),
        account,
      ])
    }

    if (accountsByOwnerEmail.size) {
      this.logger.info(
        `Notify ${accountsByOwnerEmail.size} owners of created mail accounts for user: ${this.userId}`
      )
      const accountsToNotify = [...accountsByOwnerEmail.values()].flat()
      await Promise.all(accountsToNotify.map((a) => a.load('domain')))
      for (const [ownerEmail, accounts] of accountsByOwnerEmail) {
        if (accounts.length === 1) {
          this.queueMailAccountCreatedNotification(accounts[0], ownerEmail)
        } else {
          this.queueMailAccountsCreatedBatchNotification(ownerEmail, accounts)
        }
      }
    }

    return mailAccounts
  }

  randText(
    options: {
      length?: number
      digits?: boolean
      uppercase?: boolean
      chunks?: { size?: number; separator?: string }
    } = {
      length: 25,
      digits: true,
      uppercase: true,
    }
  ) {
    const { length = 25, digits = true, uppercase = true, chunks } = options

    let chars = 'abcdefghijklmnopqrstuvwxyz'
    if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (digits) chars += '0123456789'

    let token = ''
    for (let i = 0; i < length; i++) {
      token += chars[Math.floor(Math.random() * chars.length)]
    }

    if (chunks) {
      const chunkSize = chunks.size ?? 5
      const separator = chunks.separator ?? '-'
      token = token.match(new RegExp(`.{1,${chunkSize}}`, 'g'))!.join(separator)
    }

    return token
  }

  async setupEmailAddress(data: SetupEmailAddressPayload) {
    this.logger.info(
      `Set up ${data.data.length} email addresses for domain: ${data.domainId} user: ${this.userId}`
    )
    const usernames = data.data.map((item) => item.username)
    const existingAccounts = await this.repository.findByUsernamesAndDomainId(
      usernames,
      data.domainId
    )
    if (existingAccounts.length > 0) {
      const taken = existingAccounts.map((account) => account.username).join(', ')
      this.logger.warn(
        `Set up email addresses rejected for domain: ${data.domainId}: mailboxes already exist for: ${taken}`
      )
      throw httpError(409, `A mailbox already exists for: ${taken}`)
    }

    const createMailAccountsPayload: MailAccountPayload[] = data.data.map((_) => ({
      domainId: data.domainId,
      ownerEmail: _.owner,
      username: _.username,
      password: this.randText(),
    }))
    const mailAccounts = await this.createManyMailAccount(createMailAccountsPayload)
    return mailAccounts
  }
}
