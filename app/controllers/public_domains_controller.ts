import DomainRepository from '#repositories/domain_repository'
import { DomainBrandingService } from '#services/domain_branding_service'
import { ApiResponse } from '#utils/api_response'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class PublicDomainsController {
  constructor(
    private readonly domainBrandingService: DomainBrandingService,
    private readonly domainRepository: DomainRepository
  ) {}

  async publicBranding({ params, response }: HttpContext) {
    const branding = await this.domainBrandingService.getPublicBranding(params.name)
    return response.ok(ApiResponse.success(branding, 'Branding retrieved'))
  }

  async byHostname({ params, response }: HttpContext) {
    const domain = await this.domainRepository.findByVerifiedCustomLoginHostname(params.hostname)
    if (!domain) throw httpError(404, 'No domain is configured for this hostname')
    return response.ok(ApiResponse.success({ domainName: domain.name }, 'Domain found'))
  }
}
