import { DomainService } from '#services/domain_service'
import DomainTransformer from '#transformers/domain_transformer'
import { ApiResponse } from '#utils/api_response'
import { createDomainValidator } from '#validators/domain'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class DomainsController {
  constructor(private readonly domainService: DomainService) {}

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
}
