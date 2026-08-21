import { DomainPurchaseService } from '#services/domain_purchase_service'
import { ApiResponse } from '#utils/api_response'
import {
  checkDomainAvailabilityValidator,
  createDomainPurchaseCheckoutValidator,
} from '#validators/domain_purchase'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class DomainPurchaseController {
  constructor(private readonly domainPurchaseService: DomainPurchaseService) {}

  async checkAvailability({ request, response }: HttpContext) {
    const data = await request.validateUsing(checkDomainAvailabilityValidator)
    const result = await this.domainPurchaseService.checkAvailability(data.domainName)
    return response.ok(ApiResponse.success(result, 'Domain availability checked'))
  }

  async checkout({ request, response }: HttpContext) {
    const data = await request.validateUsing(createDomainPurchaseCheckoutValidator)
    const result = await this.domainPurchaseService.createPurchaseCheckout(data)
    return response.ok(
      ApiResponse.success(
        { paymentId: result.paymentId, ...result.providerPayload },
        'Domain purchase checkout created'
      )
    )
  }

  async status({ params, response }: HttpContext) {
    const result = await this.domainPurchaseService.getPurchaseStatus(Number(params.paymentId))
    return response.ok(ApiResponse.success(result, 'Domain purchase status'))
  }
}
