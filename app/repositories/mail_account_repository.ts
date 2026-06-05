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
  async update(
    mailAccount: MailAccount,
    data: Partial<ModelProps<MailAccount>>
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
}
