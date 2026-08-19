import { StorageOverviewService } from '#services/storage_overview_service'
import { ApiResponse } from '#utils/api_response'
import { createStorageAddonCheckoutValidator } from '#validators/storage'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class StorageOverviewController {
  constructor(private readonly storageOverviewService: StorageOverviewService) {}

  async usage({ response }: HttpContext) {
    const usage = await this.storageOverviewService.getUsageForCurrentUser()
    return response.ok(ApiResponse.success(usage, 'Storage usage retrieved'))
  }

  async createAddonCheckout({ request, response }: HttpContext) {
    const data = await request.validateUsing(createStorageAddonCheckoutValidator)
    const result = await this.storageOverviewService.createStorageAddonCheckout(
      data,
      request.ip()
    )
    return response.ok(
      ApiResponse.success(
        { paymentId: result.paymentId, ...result.providerPayload },
        'Storage add-on checkout created'
      )
    )
  }

  async addonPaymentStatus({ params, response }: HttpContext) {
    const result = await this.storageOverviewService.getStorageAddonPaymentStatus(
      Number(params.paymentId)
    )
    return response.ok(ApiResponse.success(result, 'Storage add-on payment status'))
  }
}
