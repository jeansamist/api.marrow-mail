import { DomainBrandingService } from '#services/domain_branding_service'
import { DomainService } from '#services/domain_service'
import DomainBrandingTransformer from '#transformers/domain_branding_transformer'
import DomainTransformer from '#transformers/domain_transformer'
import { ApiResponse } from '#utils/api_response'
import { createDomainValidator } from '#validators/domain'
import {
  createLogoUploadLinkValidator,
  updateDomainBrandingValidator,
} from '#validators/domain_branding'
import { setCustomLoginHostnameValidator } from '#validators/domain_custom_login_hostname'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class DomainsController {
  constructor(
    private readonly domainService: DomainService,
    private readonly domainBrandingService: DomainBrandingService
  ) {}

  async index({ response, serialize }: HttpContext) {
    const domains = await this.domainService.listDomainsForCurrentUser()
    const serialized = await serialize(DomainTransformer.transform(domains))
    return response.ok(ApiResponse.success(serialized.data, 'Domains retrieved'))
  }

  async store({ request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(createDomainValidator)
    await this.domainService.setupDomain(data)
    const domain = await this.domainService.findDomainByNameOrFail(data.name)
    const serialized = await serialize(DomainTransformer.transform(domain))
    return response.created(ApiResponse.success(serialized.data, 'Domain created'))
  }

  async destroy({ params, response }: HttpContext) {
    await this.domainService.deleteDomain(Number(params.id))
    return response.ok(ApiResponse.success(null, 'Domain deleted'))
  }

  async getBranding({ params, response, serialize }: HttpContext) {
    const branding = await this.domainBrandingService.getBranding(Number(params.id))
    if (!branding) {
      return response.ok(ApiResponse.success(null, 'Branding not set'))
    }
    const serialized = await serialize(DomainBrandingTransformer.transform(branding))
    return response.ok(ApiResponse.success(serialized.data, 'Branding retrieved'))
  }

  async updateBranding({ params, request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(updateDomainBrandingValidator)
    const branding = await this.domainBrandingService.upsertBranding(Number(params.id), data)
    const serialized = await serialize(DomainBrandingTransformer.transform(branding))
    return response.ok(ApiResponse.success(serialized.data, 'Branding saved'))
  }

  async createLogoUploadLink({ params, request, response }: HttpContext) {
    const data = await request.validateUsing(createLogoUploadLinkValidator)
    const result = await this.domainBrandingService.createLogoUploadLink(Number(params.id), data)
    return response.ok(ApiResponse.success(result, 'Logo upload link created'))
  }

  async setCustomLoginHostname({ params, request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(setCustomLoginHostnameValidator)
    const domain = await this.domainService.setCustomLoginHostname(Number(params.id), data.hostname)
    const serialized = await serialize(DomainTransformer.transform(domain))
    return response.ok(ApiResponse.success(serialized.data, 'Custom login hostname saved'))
  }

  async verifyCustomLoginHostname({ params, response }: HttpContext) {
    const verified = await this.domainService.verifyCustomLoginHostname(Number(params.id))
    return response.ok(ApiResponse.success({ verified }, 'Custom login hostname verification checked'))
  }
}
