import { type MailSchema } from '#database/schema'
import Mail from '#models/mail'
import { type ModelProps } from '#utils/generics'

export default class MailRepository {
  private model = Mail

  async create(data: ModelProps<MailSchema>): Promise<Mail> {
    return this.model.create(data)
  }

  async findById(id: number): Promise<Mail | null> {
    return this.model.find(id)
  }

  async findByMailAccount(mailAccountId: number): Promise<Mail[]> {
    return this.model
      .query()
      .where('mail_account_id', mailAccountId)
      .orderBy('created_at', 'desc')
  }

  async findByMailAccountAndDirection(
    mailAccountId: number,
    direction: 'sent' | 'received'
  ): Promise<Mail[]> {
    return this.model
      .query()
      .where('mail_account_id', mailAccountId)
      .where('direction', direction)
      .orderBy('created_at', 'desc')
  }

  async update(mail: Mail, data: Partial<ModelProps<MailSchema>>): Promise<Mail> {
    return mail.merge(data).save()
  }

  async delete(mail: Mail): Promise<void> {
    await mail.delete()
  }
}
