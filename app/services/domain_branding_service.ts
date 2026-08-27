import DomainBrandingRepository from '#repositories/domain_branding_repository'
import DomainRepository from '#repositories/domain_repository'
import FileRepository from '#repositories/file_repository'
import { DomainService } from '#services/domain_service'
import { S3Service } from '#services/s3_service'
import env from '#start/env'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'

const PUBLIC_LOGO_URL_EXPIRES_IN = 60 * 60 * 24

interface BrandingPayload {
  companyName?: string | null
  welcomeMessage?: string | null
  accentColor?: string | null
  logoFileId?: number | null
}

@inject()
export class DomainBrandingService {
  constructor(
    private readonly repository: DomainBrandingRepository,
    private readonly domainRepository: DomainRepository,
    private readonly fileRepository: FileRepository,
    private readonly domainService: DomainService,
    private readonly s3Service: S3Service,
    private readonly logger: Logger
  ) {}

  async getBranding(domainId: number) {
    this.logger.info(`Get branding for domain: ${domainId}`)
    await this.assertOwnedDomain(domainId)
    return this.repository.findByDomainId(domainId)
  }

  async upsertBranding(domainId: number, data: BrandingPayload) {
    this.logger.info(`Upsert branding for domain: ${domainId}`)
    await this.assertOwnedDomain(domainId)

    if (data.logoFileId != null) {
      const file = await this.fileRepository.findById(data.logoFileId)
      if (!file) {
        this.logger.warn(
          `Branding upsert rejected for domain: ${domainId}: logo file ${data.logoFileId} not found`
        )
        throw httpError(404, 'Logo file not found')
      }
    }

    const existing = await this.repository.findByDomainId(domainId)
    if (existing) {
      this.logger.info(`Update branding: ${existing.id} for domain: ${domainId}`)
      return this.repository.update(existing, data)
    }

    this.logger.info(`Create branding for domain: ${domainId}`)
    return this.repository.create({
      companyName: null,
      welcomeMessage: null,
      accentColor: null,
      logoFileId: null,
      ...data,
      domainId,
    })
  }

  async createLogoUploadLink(
    domainId: number,
    data: { originalName: string; mimeType?: string; size?: number }
  ) {
    this.logger.info(`Create logo upload link for domain: ${domainId} file: ${data.originalName}`)
    await this.assertOwnedDomain(domainId)

    const extension = data.originalName.includes('.') ? data.originalName.split('.').pop()! : ''
    const uniqueKey = `domain-branding/${domainId}/${this.generateKey()}${extension ? `.${extension}` : ''}`
    const bucket = env.get('AWS_BUCKET')

    const file = await this.fileRepository.create({
      key: uniqueKey,
      bucket,
      originalName: data.originalName,
      mimeType: data.mimeType ?? null,
      size: data.size ?? null,
      mailAccountId: null,
      kind: 'file',
      publicToken: null,
    })

    const uploadUrl = await this.s3Service.generateUploadURL(bucket, uniqueKey, 3600, data.mimeType)
    this.logger.info(
      `Created logo upload link for domain: ${domainId} file: ${file.id} key: ${uniqueKey}`
    )
    return { uploadUrl, file }
  }

  async getPublicBranding(domainName: string) {
    this.logger.info(`Get public branding for domain: ${domainName}`)
    const domain = await this.domainRepository.findByName(domainName)
    if (!domain) {
      this.logger.warn(`Public branding lookup failed for domain: ${domainName}: domain not found`)
      throw httpError(404, 'Domain not found')
    }

    const branding = await this.repository.findByDomainId(domain.id)
    if (!branding) {
      return { companyName: null, welcomeMessage: null, accentColor: null, logoUrl: null }
    }

    const logoUrl = await this.resolveLogoUrl(branding.logoFileId)

    return {
      companyName: branding.companyName,
      welcomeMessage: branding.welcomeMessage,
      accentColor: branding.accentColor,
      logoUrl,
    }
  }

  private async resolveLogoUrl(logoFileId: number | null): Promise<string | null> {
    if (!logoFileId) return null
    const file = await this.fileRepository.findById(logoFileId)
    if (!file) {
      this.logger.warn(`Logo file: ${logoFileId} not found, returning no logo url`)
      return null
    }
    return this.s3Service.generateGetSignedUrl(file.bucket, file.key, PUBLIC_LOGO_URL_EXPIRES_IN)
  }

  private async assertOwnedDomain(domainId: number): Promise<void> {
    const domain = await this.domainService.findDomainById(domainId)
    if (!domain) {
      this.logger.warn(`Branding access rejected for domain: ${domainId}: domain not found`)
      throw httpError(404, 'Domain not found')
    }
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
