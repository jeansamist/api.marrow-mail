import Domain from '#models/domain'
import Record from '#models/record'
import DomainRepository from '#repositories/domain_repository'
import { InboundEmailSetupService } from '#services/inbound_email_setup_service'
import env from '#start/env'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { Logger } from '@adonisjs/core/logger'
import dns from 'node:dns/promises'
import CronManager from '../managers/crons_manager.ts'
import { RecordService } from './record_service.ts'
import { SESService } from './ses_service.ts'

interface DomainPayload {
  name: string
  verified: boolean
  description: string
  customLoginHostname?: string | null
  customLoginHostnameVerified?: boolean
}

interface SetupDomainPayload {
  name: string
}
@inject()
export class DomainService {
  constructor(
    private readonly repository: DomainRepository,
    private readonly ctx: HttpContext,
    private readonly sesService: SESService,
    private readonly recordService: RecordService,
    private readonly logger: Logger,
    protected readonly cronManager: CronManager,
    private readonly inboundEmailSetupService: InboundEmailSetupService
  ) {
    // Verification job to check each 10s to change domains status
    // setInterval(() => {
    //   this.logger.info('Running domain verification job')
    //   this.cronManager.addQueueJob('verification', async () => {
    //     const domains = await this.repository.findAllNotVerified()
    //     for (const domain of domains) {
    //       if (domain.verified) continue
    //       const verified = await this.sesService.checkEmailIdentity(domain.name)
    //       if (!verified) continue
    //       await this.changeDomainToVerify(domain.id)
    //       // TODO: Broaddcast a transmit message to channel: domain/[domainName]/[domainId] to say that the domain is verified
    //     }
    //   })
    // }, 10000) // Run every 10 seconds
  }
  private get userId() {
    return this.ctx.auth.user!.id
  }

  checkOwnership(domain: Domain) {
    if (domain.userId !== this.userId) {
      throw httpError(403, 'You are not allowed to access this domain')
    }
  }
  async createDomain(data: DomainPayload): Promise<Domain> {
    this.logger.info(`[DomainService]: Create new domain`)

    const domain = await this.repository.create({
      customLoginHostname: null,
      customLoginHostnameVerified: false,
      registrationStatus: 'not_purchased',
      registrationOperationId: null,
      registrantContact: null,
      hostedZoneId: null,
      purchasedAt: null,
      ...data,
      userId: this.userId,
    })
    return domain
  }

  async findDomainById(domainId: number): Promise<Domain | null> {
    this.logger.info(`[DomainService]: Find domain by id`)
    const domain = await this.repository.findById(domainId)
    if (!domain) return null
    this.checkOwnership(domain)
    return domain
  }

  async findDomainByName(domainName: string): Promise<Domain | null> {
    this.logger.info(`[DomainService]: Find domain by name`)
    const domain = await this.repository.findByName(domainName)
    if (!domain) return null
    this.checkOwnership(domain)
    return domain
  }

  async findDomainByNameOrFail(domainName: string) {
    this.logger.info(`[DomainService]: Find domain by name or fail`)
    const domain = await this.findDomainByName(domainName)
    if (!domain) {
      throw httpError(404, 'Domain not found')
    }
    return domain
  }

  async listDomainsForCurrentUser(): Promise<Domain[]> {
    this.logger.info(`[DomainService]: List domains for current user`)
    return this.repository.findAllByUserId(this.userId)
  }

  async checkDomainStatusByName(domainName: string) {
    this.logger.info(`[DomainService]: Check domain satus by name`)
    const domain = await this.findDomainByNameOrFail(domainName)
    const verified = await this.sesService.checkEmailIdentity(domain.name)

    if (verified && !domain.verified) {
      await this.changeDomainToVerify(domain.id)
      this.inboundEmailSetupService.setupDomainReceiving(domain.name).catch((error: unknown) => {
        this.logger.error(
          `[DomainService]: Failed to setup inbound email for ${domain.name}: ${error instanceof Error ? error.message : String(error)}`
        )
      })
    } else if (!verified && domain.verified) {
      // The SES identity was removed or lost verification out-of-band (e.g. deleted
      // directly in the AWS console) — reconcile our cached flag instead of leaving
      // it stale, so sends fail fast with a clear error rather than silently.
      this.logger.warn(
        `[DomainService]: Domain ${domain.name} is no longer verified in SES, marking unverified`
      )
      await this.updateDomain(domain.id, { verified: false })
    }

    return verified
  }

  async updateDomain(domainId: number, data: Partial<DomainPayload>): Promise<Domain> {
    this.logger.info(`[DomainService]: Update domain`)
    const domain = await this.findDomainById(domainId)
    if (!domain) throw httpError(404, 'Domain not found')
    return this.repository.update(domain, data)
  }

  async deleteDomain(domainId: number) {
    this.logger.info(`[DomainService]: Delete domain`)
    const domain = await this.findDomainById(domainId)
    if (!domain) throw httpError(404, 'Domain not found')
    this.checkOwnership(domain)
    return this.repository.delete(domain)
  }

  async changeDomainToVerify(domainId: number): Promise<Domain> {
    this.logger.info(`[DomainService]: Change domain to verified through the updateDomain()`)
    return await this.updateDomain(domainId, { verified: true })
  }

  async setupDomain(data: SetupDomainPayload): Promise<Record[]> {
    this.logger.info(`[DomainService]: Setup domain`)

    const existing = await this.repository.findByName(data.name)
    if (existing) {
      if (existing.userId !== this.userId) {
        throw httpError(409, 'This domain is already registered')
      }
      return this.refreshDomainRecords(existing)
    }

    const createDomainEntityPayload: DomainPayload = {
      name: data.name,
      description: `Marrowmail Domain Entity`,
      verified: false,
    }
    const domainEntity = await this.createDomain(createDomainEntityPayload)
    await this.sesService.createEmailIdentity(domainEntity.name)
    return this.storeFreshRecords(domainEntity)
  }

  /**
   * A domain already in our DB doesn't guarantee its SES identity still
   * exists — it may have been deleted directly in the AWS console, out of
   * band. Detect that and recreate the identity (and its DNS records)
   * instead of silently handing back stale, no-longer-valid records.
   */
  private async refreshDomainRecords(domain: Domain): Promise<Record[]> {
    const identityExists = await this.sesService
      .getEmailIdentity(domain.name)
      .then(() => true)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'NotFoundException') return false
        throw error
      })

    if (!identityExists) {
      this.logger.warn(
        `[DomainService]: SES identity for ${domain.name} is missing, recreating it`
      )
      await this.sesService.createEmailIdentity(domain.name)
      if (domain.verified) {
        await this.updateDomain(domain.id, { verified: false })
      }
      return this.storeFreshRecords(domain)
    }

    return this.recordService.findRecordsByDomainId(domain.id)
  }

  private async storeFreshRecords(domain: Domain): Promise<Record[]> {
    const DNSrecords = await this.sesService.getAllRecordsForEmailIdentity(domain.name)
    await this.recordService.deleteRecordsByDomainId(domain.id)
    const createManyRecordPayload = DNSrecords.map((record) => ({
      name: record.Name,
      type: record.Type,
      value: record.Value,
      priority: record.Priority || null,
      domainId: domain.id,
    }))
    return this.recordService.createManyRecord(createManyRecordPayload)
  }

  async setCustomLoginHostname(domainId: number, hostname: string): Promise<Domain> {
    this.logger.info(`[DomainService]: Set custom login hostname`)
    const domain = await this.findDomainById(domainId)
    if (!domain) throw httpError(404, 'Domain not found')

    const normalized = hostname.toLowerCase().trim()
    if (normalized !== domain.name && !normalized.endsWith(`.${domain.name}`)) {
      throw httpError(422, 'The custom login hostname must be this domain or a subdomain of it')
    }

    return this.updateDomain(domainId, {
      customLoginHostname: normalized,
      customLoginHostnameVerified: false,
    })
  }

  async verifyCustomLoginHostname(domainId: number): Promise<boolean> {
    this.logger.info(`[DomainService]: Verify custom login hostname`)
    const domain = await this.findDomainById(domainId)
    if (!domain) throw httpError(404, 'Domain not found')
    if (!domain.customLoginHostname) {
      throw httpError(400, 'No custom login hostname is configured for this domain')
    }

    const verified = await this.resolvesToExpectedIp(domain.customLoginHostname)
    if (verified !== domain.customLoginHostnameVerified) {
      await this.repository.update(domain, { customLoginHostnameVerified: verified })
    }

    return verified
  }

  private async resolvesToExpectedIp(hostname: string): Promise<boolean> {
    try {
      const addresses = await dns.resolve4(hostname)
      // Vercel assigns a project-specific anycast IP (shown on the domain
      // card in Settings > Domains) — CUSTOM_LOGIN_HOSTNAME_TARGET_IP must
      // match that value, it is not always the generic 76.76.21.21.
      return addresses.includes(env.get('CUSTOM_LOGIN_HOSTNAME_TARGET_IP', '76.76.21.21'))
    } catch {
      return false
    }
  }

  runAutomaticalyDomainVerification(domainName: string, domainId: number) {
    this.cronManager.addQueueJob(
      'verification',
      async () => {
        const verified = await this.sesService.verifyEmailIdentity(domainName)
        if (!verified) throw new Error('Domain not verified')
        await this.changeDomainToVerify(domainId)
        // TODO: Broaddcast a transmit message to channel: domain/[domainName]/[domainId] to say that the domain is verified
      },
      { retries: 2, retryDelayMs: 1000 }
    )
  }
}
