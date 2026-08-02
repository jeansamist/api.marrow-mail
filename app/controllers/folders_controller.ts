import { FolderService } from '#services/folder_service'
import FolderTransformer from '#transformers/folder_transformer'
import MailTransformer from '#transformers/mail_transformer'
import { ApiResponse } from '#utils/api_response'
import { folderValidator } from '#validators/folder'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class FoldersController {
  constructor(private readonly folderService: FolderService) {}

  async index({ response, serialize }: HttpContext) {
    const folders = await this.folderService.listFolders()
    const serialized = await serialize(FolderTransformer.transform(folders))
    return response.ok(ApiResponse.success(serialized.data, 'Folders retrieved'))
  }

  async store({ request, response, serialize }: HttpContext) {
    const { name } = await request.validateUsing(folderValidator)
    const folder = await this.folderService.createFolder(name)
    const serialized = await serialize(FolderTransformer.transform(folder))
    return response.created(ApiResponse.success(serialized.data, 'Folder created'))
  }

  async update({ params, request, response, serialize }: HttpContext) {
    const { name } = await request.validateUsing(folderValidator)
    const folder = await this.folderService.renameFolder(params.id, name)
    const serialized = await serialize(FolderTransformer.transform(folder))
    return response.ok(ApiResponse.success(serialized.data, 'Folder renamed'))
  }

  async destroy({ params, response }: HttpContext) {
    await this.folderService.deleteFolder(params.id)
    return response.ok(ApiResponse.success(null, 'Folder deleted'))
  }

  async mails({ params, response, serialize }: HttpContext) {
    const mails = await this.folderService.listMailsInFolder(params.id)
    const serialized = await serialize(MailTransformer.transform(mails))
    return response.ok(ApiResponse.success(serialized.data, 'Folder mails retrieved'))
  }
}
