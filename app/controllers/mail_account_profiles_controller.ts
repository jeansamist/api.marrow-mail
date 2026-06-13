import { MailAccountProfileService } from '#services/mail_account_profile_service'
import MailAccountProfileTransformer from '#transformers/mail_account_profile_transformer'
import { ApiResponse } from '#utils/api_response'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class MailAccountProfilesController {
  constructor(private readonly mailAccountProfileService: MailAccountProfileService) {}

  async show({ params, response, serialize }: HttpContext) {
    const profile = await this.mailAccountProfileService.getProfile(params.mailAccountId)
    const serialized = await serialize(MailAccountProfileTransformer.transform(profile))
    return response.ok(ApiResponse.success(serialized.data, 'Profile'))
  }
}
