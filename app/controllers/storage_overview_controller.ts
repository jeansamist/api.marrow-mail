import { StorageOverviewService } from '#services/storage_overview_service'
import { ApiResponse } from '#utils/api_response'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class StorageOverviewController {
  constructor(private readonly storageOverviewService: StorageOverviewService) {}

  async usage({ response }: HttpContext) {
    const usage = await this.storageOverviewService.getUsageForCurrentUser()
    return response.ok(ApiResponse.success(usage, 'Storage usage retrieved'))
  }
}
