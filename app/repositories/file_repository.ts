import { type FileSchema } from '#database/schema'
import File from '#models/file'
import { type ModelProps } from '#utils/generics'

export default class FileRepository {
  private model = File

  async create(data: ModelProps<FileSchema>): Promise<File> {
    return this.model.create(data)
  }

  async findById(id: number): Promise<File | null> {
    return this.model.find(id)
  }

  async findByKey(key: string): Promise<File | null> {
    return this.model.findBy('key', key)
  }

  async findByPublicToken(publicToken: string): Promise<File | null> {
    return this.model.findBy('public_token', publicToken)
  }

  async update(file: File, data: Partial<ModelProps<FileSchema>>): Promise<File> {
    return file.merge(data).save()
  }

  async findByMailAccount(mailAccountId: number): Promise<File[]> {
    return this.model.query().where('mail_account_id', mailAccountId).orderBy('created_at', 'desc')
  }

  async sumSizeByMailAccountId(mailAccountId: number): Promise<number> {
    const result = await this.model
      .query()
      .where('mail_account_id', mailAccountId)
      .sum('size as total')
    return Number(result[0].$extras.total) || 0
  }

  async sumSizeByMailAccountIds(mailAccountIds: number[]): Promise<Map<number, number>> {
    const usageByAccount = new Map<number, number>()
    if (mailAccountIds.length === 0) return usageByAccount

    const rows = await this.model
      .query()
      .whereIn('mail_account_id', mailAccountIds)
      .groupBy('mail_account_id')
      .select('mail_account_id')
      .sum('size as total')

    for (const row of rows) {
      usageByAccount.set(row.mailAccountId!, Number(row.$extras.total) || 0)
    }
    return usageByAccount
  }

  async delete(file: File): Promise<void> {
    await file.delete()
  }
}
