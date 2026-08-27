import FileRepository from '#repositories/file_repository'
import { AuthMailAccountService } from '#services/auth_mail_account_service'
import { S3Service } from '#services/s3_service'
import { StorageOverviewService } from '#services/storage_overview_service'
import env from '#start/env'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import { randomBytes } from 'node:crypto'

type FileKind = 'file' | 'voice_note'

@inject()
export class StorageService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly authMailAccountService: AuthMailAccountService,
    private readonly fileRepository: FileRepository,
    private readonly storageOverviewService: StorageOverviewService,
    private readonly logger: Logger
  ) {}

  async createUploadLink(data: {
    originalName: string
    mimeType?: string
    size?: number
    kind?: FileKind
  }) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(
      `Create upload link for mail account: ${mailAccount.id} file: ${data.originalName} kind: ${data.kind ?? 'file'} size: ${data.size ?? 0}`
    )
    await this.storageOverviewService.assertWithinQuota(mailAccount.id, data.size ?? 0)
    return this.buildUploadLink(mailAccount.id, data)
  }

  async createUploadLinks(
    files: { originalName: string; mimeType?: string; size?: number; kind?: FileKind }[]
  ) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    const totalSize = files.reduce((sum, file) => sum + (file.size ?? 0), 0)
    this.logger.info(
      `Create upload links for mail account: ${mailAccount.id} files: ${files.length} total size: ${totalSize}`
    )
    await this.storageOverviewService.assertWithinQuota(mailAccount.id, totalSize)
    return Promise.all(files.map((file) => this.buildUploadLink(mailAccount.id, file)))
  }

  private async buildUploadLink(
    mailAccountId: number,
    data: { originalName: string; mimeType?: string; size?: number; kind?: FileKind }
  ) {
    const extension = data.originalName.includes('.') ? data.originalName.split('.').pop()! : ''
    const uniqueKey = `mail-accounts/${mailAccountId}/${this.generateKey()}${extension ? `.${extension}` : ''}`
    const bucket = env.get('AWS_BUCKET')
    const kind = data.kind ?? 'file'

    const file = await this.fileRepository.create({
      key: uniqueKey,
      bucket,
      originalName: data.originalName,
      mimeType: data.mimeType ?? null,
      size: data.size ?? null,
      mailAccountId,
      kind,
      // Generated up front — a voice note's link never needs to change even
      // if it's later attached to more than one email.
      publicToken: kind === 'voice_note' ? randomBytes(24).toString('hex') : null,
    })
    this.logger.info(
      `Created file: ${file.id} key: ${uniqueKey} kind: ${kind} size: ${data.size ?? 0} for mail account: ${mailAccountId}`
    )

    const uploadUrl = await this.s3Service.generateUploadURL(bucket, uniqueKey, 3600, data.mimeType)

    return { uploadUrl, file }
  }

  async getFileByKey(key: string) {
    this.logger.info(`Get file by key: ${key}`)
    const file = await this.fileRepository.findByKey(key)
    if (!file) {
      this.logger.warn(`File not found for key: ${key}`)
      throw httpError(404, 'File not found')
    }
    return file
  }

  async getPresignedDownloadUrl(key: string) {
    const file = await this.getFileByKey(key)
    this.logger.info(
      `Generate download URL for file: ${file.id} key: ${file.key} mail account: ${file.mailAccountId}`
    )
    const url = await this.s3Service.generateGetSignedUrl(file.bucket, file.key, 3600)
    return url
  }

  /** Public — no mail-account auth. Looked up by the opaque publicToken, not the numeric id. */
  async getPublicVoiceNote(token: string) {
    const file = await this.fileRepository.findByPublicToken(token)
    if (!file || file.kind !== 'voice_note') {
      this.logger.warn(
        `Public voice note not found: file: ${file?.id ?? 'none'} kind: ${file?.kind ?? 'none'}`
      )
      throw httpError(404, 'Voice message not found')
    }
    this.logger.info(
      `Get public voice note file: ${file.id} for mail account: ${file.mailAccountId}`
    )
    const audioUrl = await this.s3Service.generateGetSignedUrl(file.bucket, file.key, 3600)
    return { audioUrl, originalName: file.originalName, mimeType: file.mimeType }
  }

  async listFiles() {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(`List files for mail account: ${mailAccount.id}`)
    return this.fileRepository.findByMailAccount(mailAccount.id)
  }

  async deleteFile(key: string) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(`Delete file key: ${key} for mail account: ${mailAccount.id}`)
    const file = await this.fileRepository.findByKey(key)
    if (!file) {
      this.logger.warn(
        `Delete file rejected for mail account: ${mailAccount.id}: file not found key: ${key}`
      )
      throw httpError(404, 'File not found')
    }
    if (file.mailAccountId !== mailAccount.id) {
      this.logger.warn(
        `Delete file rejected for mail account: ${mailAccount.id}: file: ${file.id} belongs to mail account: ${file.mailAccountId}`
      )
      throw httpError(403, 'Forbidden')
    }
    await this.fileRepository.delete(file)
    this.logger.info(`Deleted file: ${file.id} key: ${key} for mail account: ${mailAccount.id}`)
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
