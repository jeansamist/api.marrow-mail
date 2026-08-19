import { type MailSchema } from '#database/schema'
import Mail from '#models/mail'
import { type ModelProps } from '#utils/generics'
import db from '@adonisjs/lucid/services/db'
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

  async findTrashByMailAccount(mailAccountId: number): Promise<Mail[]> {
    return this.model
      .query()
      .where('mail_account_id', mailAccountId)
      .where('deleted', true)
      .orderBy('updated_at', 'desc')
  }

  async findSpamByMailAccount(mailAccountId: number): Promise<Mail[]> {
    return this.model
      .query()
      .where('mail_account_id', mailAccountId)
      .where('is_spam', true)
      .where('deleted', false)
      .orderBy('created_at', 'desc')
  }

  /**
   * Approximate on-disk bytes of stored email content (subject, bodies,
   * addresses) per mail account — counts everything regardless of
   * deleted/spam/draft status, since it's still occupying storage until
   * permanently purged. Attachments are tracked separately in FileRepository.
   */
  async sumContentSizeByMailAccountIds(mailAccountIds: number[]): Promise<Map<number, number>> {
    const usageByAccount = new Map<number, number>()
    if (mailAccountIds.length === 0) return usageByAccount

    const rows = await this.model
      .query()
      .whereIn('mail_account_id', mailAccountIds)
      .groupBy('mail_account_id')
      .select('mail_account_id')
      .select(
        db.raw(`
          coalesce(sum(
            octet_length(coalesce(subject, '')) +
            octet_length(coalesce(body_html, '')) +
            octet_length(coalesce(body_text, '')) +
            octet_length(coalesce(from_email, '')) +
            octet_length(coalesce(reply_to, '')) +
            octet_length(coalesce(to_addresses::text, '')) +
            octet_length(coalesce(cc_addresses::text, '')) +
            octet_length(coalesce(bcc_addresses::text, ''))
          ), 0) as total
        `)
      )

    for (const row of rows) {
      usageByAccount.set(row.mailAccountId!, Number(row.$extras.total) || 0)
    }
    return usageByAccount
  }

  async update(mail: Mail, data: Partial<ModelProps<MailSchema>>): Promise<Mail> {
    return mail.merge(data).save()
  }

  async delete(mail: Mail): Promise<void> {
    await mail.delete()
  }
}
