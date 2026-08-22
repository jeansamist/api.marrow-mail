import { StorageService } from '#services/storage_service'
import { ApiResponse } from '#utils/api_response'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class VoiceNotesController {
  constructor(private readonly storageService: StorageService) {}

  async show({ params, response }: HttpContext) {
    const data = await this.storageService.getPublicVoiceNote(params.token)
    return response.ok(ApiResponse.success(data, 'Voice message'))
  }
}
