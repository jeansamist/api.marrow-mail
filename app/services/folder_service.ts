import FolderRepository from '#repositories/folder_repository'
import MailRepository from '#repositories/mail_repository'
import { AuthMailAccountService } from '#services/auth_mail_account_service'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'

@inject()
export class FolderService {
  constructor(
    private readonly folderRepository: FolderRepository,
    private readonly mailRepository: MailRepository,
    private readonly authMailAccountService: AuthMailAccountService
  ) {}

  async createFolder(name: string) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    const existing = await this.folderRepository.findByMailAccountAndName(mailAccount.id, name)
    if (existing) throw httpError(409, 'A folder with this name already exists')

    return this.folderRepository.create({ mailAccountId: mailAccount.id, name })
  }

  async listFolders() {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    return this.folderRepository.findByMailAccount(mailAccount.id)
  }

  async renameFolder(id: number, name: string) {
    const folder = await this.getOwnedFolder(id)
    const existing = await this.folderRepository.findByMailAccountAndName(
      folder.mailAccountId,
      name
    )
    if (existing && existing.id !== folder.id) {
      throw httpError(409, 'A folder with this name already exists')
    }

    return this.folderRepository.update(folder, { name })
  }

  async deleteFolder(id: number) {
    const folder = await this.getOwnedFolder(id)
    await this.folderRepository.delete(folder)
  }

  async listMailsInFolder(id: number) {
    const folder = await this.getOwnedFolder(id)
    return this.mailRepository.findByFolder(folder.id)
  }

  private async getOwnedFolder(id: number) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    const folder = await this.folderRepository.findById(id)
    if (!folder || folder.mailAccountId !== mailAccount.id) {
      throw httpError(404, 'Folder not found')
    }
    return folder
  }
}
