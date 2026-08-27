import FolderRepository from '#repositories/folder_repository'
import MailRepository from '#repositories/mail_repository'
import { AuthMailAccountService } from '#services/auth_mail_account_service'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'

@inject()
export class FolderService {
  constructor(
    private readonly folderRepository: FolderRepository,
    private readonly mailRepository: MailRepository,
    private readonly authMailAccountService: AuthMailAccountService,
    private readonly logger: Logger
  ) {}

  async createFolder(name: string) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(`Create folder: ${name} for mail account: ${mailAccount.id}`)
    const existing = await this.folderRepository.findByMailAccountAndName(mailAccount.id, name)
    if (existing) {
      this.logger.warn(
        `Create folder rejected for mail account: ${mailAccount.id}: name already used by folder: ${existing.id} name: ${name}`
      )
      throw httpError(409, 'A folder with this name already exists')
    }

    return this.folderRepository.create({ mailAccountId: mailAccount.id, name })
  }

  async listFolders() {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(`List folders for mail account: ${mailAccount.id}`)
    return this.folderRepository.findByMailAccount(mailAccount.id)
  }

  async renameFolder(id: number, name: string) {
    const folder = await this.getOwnedFolder(id)
    this.logger.info(
      `Rename folder: ${folder.id} from: ${folder.name} to: ${name} for mail account: ${folder.mailAccountId}`
    )
    const existing = await this.folderRepository.findByMailAccountAndName(
      folder.mailAccountId,
      name
    )
    if (existing && existing.id !== folder.id) {
      this.logger.warn(
        `Rename folder rejected for folder: ${folder.id} mail account: ${folder.mailAccountId}: name already used by folder: ${existing.id} name: ${name}`
      )
      throw httpError(409, 'A folder with this name already exists')
    }

    return this.folderRepository.update(folder, { name })
  }

  async deleteFolder(id: number) {
    const folder = await this.getOwnedFolder(id)
    this.logger.info(`Delete folder: ${folder.id} for mail account: ${folder.mailAccountId}`)
    await this.folderRepository.delete(folder)
  }

  async listMailsInFolder(id: number) {
    const folder = await this.getOwnedFolder(id)
    this.logger.info(`List mails in folder: ${folder.id} for mail account: ${folder.mailAccountId}`)
    return this.mailRepository.findByFolder(folder.id)
  }

  private async getOwnedFolder(id: number) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    const folder = await this.folderRepository.findById(id)
    if (!folder || folder.mailAccountId !== mailAccount.id) {
      this.logger.warn(
        `Folder not found: ${id} for mail account: ${mailAccount.id}: ${folder ? 'belongs to another mail account' : 'no such folder'}`
      )
      throw httpError(404, 'Folder not found')
    }
    return folder
  }
}
