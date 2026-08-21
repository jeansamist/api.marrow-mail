import { type SignatureSchema } from '#database/schema'
import Signature from '#models/signature'
import { type ModelProps } from '#utils/generics'
import db from '@adonisjs/lucid/services/db'

export default class SignatureRepository {
  private model = Signature

  async create(data: ModelProps<SignatureSchema>): Promise<Signature> {
    return this.model.create(data)
  }

  async findByMailAccountId(mailAccountId: number): Promise<Signature | null> {
    return this.model.query().where('mail_account_id', mailAccountId).first()
  }

  async update(
    signature: Signature,
    data: Partial<ModelProps<SignatureSchema>>
  ): Promise<Signature> {
    return signature.merge(data).save()
  }

  async delete(signature: Signature): Promise<void> {
    await signature.delete()
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
            octet_length(coalesce(name, '')) +
            octet_length(coalesce(job_title, '')) +
            octet_length(coalesce(phone, '')) +
            octet_length(coalesce(address, '')) +
            octet_length(coalesce(website, '')) +
            octet_length(coalesce(linkedin, '')) +
            octet_length(coalesce(instagram, '')) +
            octet_length(coalesce(facebook, ''))
          ), 0) as total
        `)
      )

    for (const row of rows) {
      usageByAccount.set(row.mailAccountId!, Number(row.$extras.total) || 0)
    }
    return usageByAccount
  }
}
