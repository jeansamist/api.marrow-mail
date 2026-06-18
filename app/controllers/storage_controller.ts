import { StorageService } from '#services/storage_service'
import FileTransformer from '#transformers/file_transformer'
import { ApiResponse } from '#utils/api_response'
import { createUploadLinkValidator, createUploadLinksValidator } from '#validators/storage'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class StorageController {
  constructor(private readonly storageService: StorageService) {}

  async createUploadLink({ request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(createUploadLinkValidator)
    const { uploadUrl, file } = await this.storageService.createUploadLink(data)
    const serialized = await serialize(FileTransformer.transform(file))
    return response.ok(
      ApiResponse.success({ uploadUrl, file: serialized.data }, 'Upload link created')
    )
  }

  async createUploadLinks({ request, response, serialize }: HttpContext) {
    const { files } = await request.validateUsing(createUploadLinksValidator)
    const results = await this.storageService.createUploadLinks(files)
    const serialized = await Promise.all(
      results.map(({ uploadUrl, file }) =>
        serialize(FileTransformer.transform(file)).then((s) => ({ uploadUrl, file: s.data }))
      )
    )
    return response.ok(ApiResponse.success(serialized, 'Upload links created'))
  }

  async files({ response, serialize }: HttpContext) {
    const files = await this.storageService.listFiles()
    const serialized = await serialize(FileTransformer.transform(files))
    return response.ok(ApiResponse.success(serialized.data, 'Files retrieved'))
  }

  async getFile({ params, response }: HttpContext) {
    const key = params['*'].join('/')
    const url = await this.storageService.getPresignedDownloadUrl(key)
    return response.redirect(url)
  }

  async deleteFile({ params, response }: HttpContext) {
    const key = params['*'].join('/')
    await this.storageService.deleteFile(key)
    return response.ok(ApiResponse.success(null, 'File deleted'))
  }
}
