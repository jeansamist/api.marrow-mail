import DomainRepository from '#repositories/domain_repository'
import RecordRepository from '#repositories/record_repository'
import { Route53DomainsService } from '#services/route53_domains_service'
import { Route53Service } from '#services/route53_service'
import { SESService } from '#services/ses_service'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'

/**
 * Polls AWS for pending domain registrations and auto-provisions DNS once
 * they complete. Runs from a recurring cron job (see SchedulerProvider),
 * outside of any HTTP request — unlike DomainPurchaseService, it has no
 * HttpContext dependency, since one isn't available to inject at all
 * outside a real request.
 */
@inject()
export class DomainRegistrationDispatchService {
  constructor(
    private readonly domainRepository: DomainRepository,
    private readonly recordRepository: RecordRepository,
    private readonly sesService: SESService,
    private readonly route53Service: Route53Service,
    private readonly route53DomainsService: Route53DomainsService,
    private readonly logger: Logger
  ) {}

  async pollPendingRegistrations(): Promise<void> {
    const pending = await this.domainRepository.findAllByRegistrationStatus('pending_registration')
    if (pending.length > 0) {
      this.logger.info(`Poll pending domain registrations: ${pending.length}`)
    }

    for (const domain of pending) {
      if (!domain.registrationOperationId) {
        this.logger.warn(
          `Skipping registration poll for domain: ${domain.name}: no registration operation id`
        )
        continue
      }

      try {
        const operation = await this.route53DomainsService.getOperationDetail(
          domain.registrationOperationId
        )

        if (operation.Status === 'SUCCESSFUL') {
          await this.finishRegistration(domain)
        } else if (operation.Status === 'ERROR' || operation.Status === 'FAILED') {
          this.logger.error(`Domain registration failed for ${domain.name}: ${operation.Message}`)
          await this.domainRepository.update(domain, { registrationStatus: 'failed' })
        }
      } catch (error) {
        this.logger.error(
          `Failed to poll registration operation for ${domain.name}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }
  }

  private async finishRegistration(domain: {
    id: number
    name: string
    userId: number | null
  }): Promise<void> {
    this.logger.info(
      `Finish domain registration: ${domain.name} domain: ${domain.id} user: ${domain.userId}`
    )
    const hostedZone = await this.route53Service.createHostedZone(domain.name)
    const hostedZoneId = hostedZone.HostedZone?.Id?.replace('/hostedzone/', '') ?? null

    await this.sesService.createEmailIdentity(domain.name)
    await this.sesService.putEmailIdentityMailFromAttributes(domain.name)
    const dnsRecords = await this.sesService.getAllRecordsForEmailIdentity(domain.name)
    this.logger.info(
      `Created SES identity for domain: ${domain.name} hostedZone: ${hostedZoneId} records: ${dnsRecords.length}`
    )

    if (hostedZoneId) {
      await this.route53Service.upsertRecords(
        hostedZoneId,
        dnsRecords.map((record) => ({
          name: record.Name,
          type: record.Type,
          value: record.Value,
          priority: record.Priority ?? null,
        }))
      )
    } else {
      this.logger.warn(
        `No hosted zone id returned for domain: ${domain.name}, skipping Route53 record upsert`
      )
    }

    await this.recordRepository.createMany(
      dnsRecords.map((record) => ({
        name: record.Name,
        type: record.Type,
        value: record.Value,
        priority: record.Priority ?? null,
        domainId: domain.id,
        userId: domain.userId!,
      }))
    )

    const fullDomain = await this.domainRepository.findById(domain.id)
    if (fullDomain) {
      await this.domainRepository.update(fullDomain, {
        registrationStatus: 'registered',
        hostedZoneId,
      })
    } else {
      this.logger.warn(
        `Domain: ${domain.id} not found after registration, registration status not updated`
      )
    }

    this.logger.info(`Domain ${domain.name} registered and DNS auto-provisioned`)
  }
}
