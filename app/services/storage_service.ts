import FileRepository from '#repositories/file_repository'
import { AuthMailAccountService } from '#services/auth_mail_account_service'
import { S3Service } from '#services/s3_service'
import env from '#start/env'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'

@inject()
export class StorageService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly authMailAccountService: AuthMailAccountService,
    private readonly fileRepository: FileRepository
  ) {}

  async createUploadLink(data: { originalName: string; mimeType?: string; size?: number }) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    return this.buildUploadLink(mailAccount.id, data)
  }

  async createUploadLinks(files: { originalName: string; mimeType?: string; size?: number }[]) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    return Promise.all(files.map((file) => this.buildUploadLink(mailAccount.id, file)))
  }

  private async buildUploadLink(
    mailAccountId: number,
    data: { originalName: string; mimeType?: string; size?: number }
  ) {
    const extension = data.originalName.includes('.') ? data.originalName.split('.').pop()! : ''
    const uniqueKey = `mail-accounts/${mailAccountId}/${this.generateKey()}${extension ? `.${extension}` : ''}`
    const bucket = env.get('AWS_BUCKET')

    const file = await this.fileRepository.create({
      key: uniqueKey,
      bucket,
      originalName: data.originalName,
      mimeType: data.mimeType ?? null,
      size: data.size ?? null,
      mailAccountId,
    })

    const uploadUrl = await this.s3Service.generateUploadURL(bucket, uniqueKey, 3600, data.mimeType)

    return { uploadUrl, file }
  }

  async getFileByKey(key: string) {
    const file = await this.fileRepository.findByKey(key)
    if (!file) throw httpError(404, 'File not found')
    return file
  }

  async getPresignedDownloadUrl(key: string) {
    const file = await this.getFileByKey(key)
    const url = await this.s3Service.generateGetSignedUrl(file.bucket, file.key, 3600)
    return url
  }

  async listFiles() {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    return this.fileRepository.findByMailAccount(mailAccount.id)
  }

  async deleteFile(key: string) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    const file = await this.fileRepository.findByKey(key)
    if (!file) throw httpError(404, 'File not found')
    if (file.mailAccountId !== mailAccount.id) throw httpError(403, 'Forbidden')
    await this.fileRepository.delete(file)
  }

  private generateKey(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let key = ''
    for (let i = 0; i < 24; i++) {
      key += chars[Math.floor(Math.random() * chars.length)]
    }
    return key
  }
}
