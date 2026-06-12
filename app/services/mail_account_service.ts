import MailAccount from '#models/mail_account'
import MailAccountRepository from '#repositories/mail_account_repository'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { Logger } from '@adonisjs/core/logger'

import hash from '@adonisjs/core/services/hash'
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
    private readonly logger: Logger
  ) {}
  private get userId() {
    return this.ctx.auth.user!.id
  }

  checkOwnership(mailAccount: MailAccount) {
    if (mailAccount.userId !== this.userId) {
      throw httpError(403, 'You are not allowed to access this mail account')
    }
  }

  async createMailAccount(data: MailAccountPayload): Promise<MailAccount> {
    const hashedPassword = await hash.make(data.password)
    const mailAccount = await this.repository.create({
      ...data,
      userId: this.userId,
      password: hashedPassword,
    })
    return mailAccount
  }

  async createManyMailAccount(data: MailAccountPayload[]) {
    const hashedData = await Promise.all(
      data.map(async (mailAccount) => ({
        ...mailAccount,
        password: await hash.make(mailAccount.password),
        userId: this.userId,
      }))
    )
    return this.repository.createMany(hashedData)
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

  generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    for (let i = 0; i < 32; i++) {
      token += chars[Math.floor(Math.random() * chars.length)]
    }
    return token
  }

  async setupEmailAddress(data: SetupEmailAddressPayload) {
    const createMailAccountsPayload: MailAccountPayload[] = data.data.map((_) => ({
      domainId: data.domainId,
      ownerEmail: _.owner,
      username: _.username,
      password: this.generatePassword(),
    }))
    const mailAccounts = await this.createManyMailAccount(createMailAccountsPayload)
    // TODO: Send creation notification to owner email that he has to setup his account
    return mailAccounts
  }
}
