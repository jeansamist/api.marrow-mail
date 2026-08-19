import { type MailAccountSchema } from '#database/schema'
import MailAccount from '#models/mail_account'
import { type ModelProps } from '#utils/generics'
export default class MailAccountRepository {
  private model = MailAccount
  get getModel(): typeof MailAccount {
    return this.model
  }

  async create(data: ModelProps<MailAccountSchema>): Promise<MailAccount> {
    const mailAccount = new this.model()
    mailAccount.fill(data)
    await mailAccount.save()
    return mailAccount
  }

  async createMany(data: ModelProps<MailAccountSchema>[]) {
    return this.model.createMany(data)
  }

  async findById(id: number): Promise<MailAccount | null> {
    return this.model.find(id)
  }

  async findByCuid(cuid: string) {
    return this.model.findBy('cuid', cuid)
  }
  async update(
    mailAccount: MailAccount,
    data: Partial<ModelProps<MailAccountSchema>>
  ): Promise<MailAccount> {
    return mailAccount.merge(data).save()
  }

  findByUsernameAndDomain(username: string, domainName: string): Promise<MailAccount | null> {
    return this.model
      .query()
      .where('username', username)
      .whereHas('domain', (query) => {
        query.andWhere('name', domainName)
      })
      .first()
  }

  findByUsernameAndDomainAndResetPasswordToken(
    username: string,
    domainName: string,
    resetPasswordToken: string
  ): Promise<MailAccount | null> {
    return this.model
      .query()
      .where('username', username)
      .where('reset_password_token', resetPasswordToken)
      .whereHas('domain', (query) => {
        query.andWhere('name', domainName)
      })
      .first()
  }

  findByForwardingVerificationToken(token: string): Promise<MailAccount | null> {
    return this.model.query().where('forwarding_verification_token', token).first()
  }

  async countByUserId(userId: number): Promise<number> {
    const result = await this.model.query().where('user_id', userId).count('* as total')
    return Number(result[0].$extras.total)
  }

  async findAllByUserId(userId: number): Promise<MailAccount[]> {
    return this.model.query().where('user_id', userId).orderBy('created_at', 'desc')
  }

  async delete(mailAccount: MailAccount): Promise<void> {
    await mailAccount.delete()
  }
}
