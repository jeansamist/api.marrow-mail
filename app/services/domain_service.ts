import Domain from '#models/domain'
import Record from '#models/record'
import DomainRepository from '#repositories/domain_repository'
import { InboundEmailSetupService } from '#services/inbound_email_setup_service'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { Logger } from '@adonisjs/core/logger'
import CronManager from '../managers/crons_manager.ts'
import { RecordService } from './record_service.ts'
import { SESService } from './ses_service.ts'

interface DomainPayload {
  name: string
  verified: boolean
  description: string
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
    console.log(this.userId)

    const domain = await this.repository.create({ ...data, userId: this.userId })
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
    const createDomainEntityPayload: DomainPayload = {
      name: data.name,
      description: `Marrowmail Domain Entity`,
      verified: false,
    }
    const domainEntity = await this.createDomain(createDomainEntityPayload)
    await this.sesService.createEmailIdentity(domainEntity.name)
    const DNSrecords = await this.sesService.getAllRecordsForEmailIdentity(domainEntity.name)
    const createManyRecordPayload = DNSrecords.map((dns) => ({
      name: dns.Name,
      type: dns.Type,
      value: dns.Value,
      priority: dns.Priority || null,
      domainId: domainEntity.id,
    }))
    const records = await this.recordService.createManyRecord(createManyRecordPayload)
    return records
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
