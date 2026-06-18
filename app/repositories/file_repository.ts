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

  async findByMailAccount(mailAccountId: number): Promise<File[]> {
    return this.model.query().where('mail_account_id', mailAccountId).orderBy('created_at', 'desc')
  }

  async delete(file: File): Promise<void> {
    await file.delete()
  }
}
