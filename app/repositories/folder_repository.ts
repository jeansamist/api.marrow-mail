import { type FolderSchema } from '#database/schema'
import Folder from '#models/folder'
import { type ModelProps } from '#utils/generics'

export default class FolderRepository {
  private model = Folder

  async create(data: ModelProps<FolderSchema>): Promise<Folder> {
    return this.model.create(data)
  }

  async findById(id: number): Promise<Folder | null> {
    return this.model.find(id)
  }

  async findByMailAccount(mailAccountId: number): Promise<Folder[]> {
    return this.model.query().where('mail_account_id', mailAccountId).orderBy('name', 'asc')
  }

  async findByMailAccountAndName(mailAccountId: number, name: string): Promise<Folder | null> {
    return this.model.query().where('mail_account_id', mailAccountId).where('name', name).first()
  }

  async update(folder: Folder, data: Partial<ModelProps<FolderSchema>>): Promise<Folder> {
    return folder.merge(data).save()
  }

  async delete(folder: Folder): Promise<void> {
    await folder.delete()
  }
}
