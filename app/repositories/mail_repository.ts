import { type MailSchema } from '#database/schema'
import Mail from '#models/mail'
import { type ModelProps } from '#utils/generics'
import { type DateTime } from 'luxon'

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
      .where('deleted', false)
      .whereNotIn('status', ['draft', 'scheduled'])
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
      .where('deleted', false)
      .whereNotIn('status', ['draft', 'scheduled'])
      .orderBy('created_at', 'desc')
  }

  async findDraftsByMailAccount(mailAccountId: number): Promise<Mail[]> {
    return this.model
      .query()
      .where('mail_account_id', mailAccountId)
      .where('status', 'draft')
      .where('deleted', false)
      .orderBy('updated_at', 'desc')
  }

  async findScheduledByMailAccount(mailAccountId: number): Promise<Mail[]> {
    return this.model
      .query()
      .where('mail_account_id', mailAccountId)
      .where('status', 'scheduled')
      .where('deleted', false)
      .orderBy('scheduled_at', 'asc')
  }

  async findDueScheduledMails(before: DateTime): Promise<Mail[]> {
    return this.model
      .query()
      .where('status', 'scheduled')
      .where('deleted', false)
      .where('scheduled_at', '<=', before.toJSDate())
  }

  async findByFolder(folderId: number): Promise<Mail[]> {
    return this.model
      .query()
      .where('folder_id', folderId)
      .where('deleted', false)
      .orderBy('created_at', 'desc')
  }

  async update(mail: Mail, data: Partial<ModelProps<MailSchema>>): Promise<Mail> {
    return mail.merge(data).save()
  }

  async delete(mail: Mail): Promise<void> {
    await mail.delete()
  }
}
