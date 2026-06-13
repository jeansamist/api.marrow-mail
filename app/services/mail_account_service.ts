import MailAccountCreatedNotification from '#mails/mail_account_created_notification'
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

interface LoginMailAccountPayload {
  email: string
  password: string
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

  checkOwnership(mailAccount: MailAccount) {
    if (mailAccount.userId !== this.userId) {
      throw httpError(403, 'You are not allowed to access this mail account')
    }
  }

  private queueMailAccountCreatedNotification(mailAccount: MailAccount, ownerEmail: string) {
    const mailAccountEmail = `${mailAccount.username}@${mailAccount.domain.name}`
    const setupLink =
      `${env.get('FRONTEND_APP_URL')}/en/${mailAccount.domain.name}/setup-account` +
      `?cuid=${mailAccount.cuid}`
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

  async createMailAccount(data: MailAccountPayload): Promise<MailAccount> {
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
    })

    if (data.ownerEmail) {
      await mailAccount.load('domain')
      this.queueMailAccountCreatedNotification(mailAccount, data.ownerEmail)
    }

    return mailAccount
  }

  async createManyMailAccount(data: MailAccountPayload[]) {
    const hashedData = await Promise.all(
      data.map(async (item) => {
        const cuid = this.randText({
          length: 20,
          uppercase: false,
          chunks: { separator: '-', size: 5 },
        })
        const password = await hash.make(item.password)
        return { ...item, password, userId: this.userId, cuid, setuped: false }
      })
    )
    const mailAccounts = await this.repository.createMany(hashedData)

    const accountsWithOwner = mailAccounts.filter(
      (account) => data.find((d) => d.username === account.username)?.ownerEmail
    )

    if (accountsWithOwner.length) {
      await Promise.all(accountsWithOwner.map((a) => a.load('domain')))
      for (const account of accountsWithOwner) {
        const ownerEmail = data.find((d) => d.username === account.username)!.ownerEmail!
        this.queueMailAccountCreatedNotification(account, ownerEmail)
      }
    }

    return mailAccounts
  }

  async login(data: LoginMailAccountPayload) {
    const [username, domain] = data.email.split('@')
    const mailAccount = await this.repository.findByUsernameAndDomain(username, domain)
    if (!mailAccount) throw httpError(400, 'Invalid email or password')

    // Check password
    const hashedPassword = await hash.make(data.password)
    if (hashedPassword !== mailAccount.password) throw httpError(400, 'Invalid email or password')

    return mailAccount
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
    const createMailAccountsPayload: MailAccountPayload[] = data.data.map((_) => ({
      domainId: data.domainId,
      ownerEmail: _.owner,
      username: _.username,
      password: this.randText(),
    }))
    const mailAccounts = await this.createManyMailAccount(createMailAccountsPayload)
    // TODO: Send creation notification to owner email that he has to setup his account
    return mailAccounts
  }
}
