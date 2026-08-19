import { type MailAccountProfileSchema } from '#database/schema'
import MailAccountProfile from '#models/mail_account_profile'
import { type ModelProps } from '#utils/generics'
import db from '@adonisjs/lucid/services/db'

export default class MailAccountProfileRepository {
  private model = MailAccountProfile

  get getModel(): typeof MailAccountProfile {
    return this.model
  }

  async create(data: ModelProps<MailAccountProfileSchema>): Promise<MailAccountProfile> {
    const profile = new this.model()
    profile.fill(data)
    await profile.save()
    return profile
  }

  async findById(id: number): Promise<MailAccountProfile | null> {
    return this.model.find(id)
  }

  async findByMailAccountId(mailAccountId: number): Promise<MailAccountProfile | null> {
    return this.model.query().where('mail_account_id', mailAccountId).first()
  }

  async update(
    profile: MailAccountProfile,
    data: Partial<ModelProps<MailAccountProfileSchema>>
  ): Promise<MailAccountProfile> {
    return profile.merge(data).save()
  }

  async delete(profile: MailAccountProfile): Promise<void> {
    await profile.delete()
  }

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
            octet_length(coalesce(avatar, '')) +
            octet_length(coalesce(first_name, '')) +
            octet_length(coalesce(last_name, ''))
          ), 0) as total
        `)
      )

    for (const row of rows) {
      usageByAccount.set(row.mailAccountId!, Number(row.$extras.total) || 0)
    }
    return usageByAccount
  }
}
