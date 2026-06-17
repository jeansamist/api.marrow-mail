import { MailAccountProfileService } from '#services/mail_account_profile_service'
import { MailAccountService } from '#services/mail_account_service'
import MailAccountProfileTransformer from '#transformers/mail_account_profile_transformer'
import { ApiResponse } from '#utils/api_response'
import { setupMailAccountProfileValidator } from '#validators/mail_account_profile'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class MailAccountProfilesController {
  constructor(
    private readonly mailAccountProfileService: MailAccountProfileService,
    private readonly mailAccountService: MailAccountService
  ) {}

  async show({ params, response, serialize }: HttpContext) {
    const profile = await this.mailAccountProfileService.getProfile(params.mailAccountId)
    const serialized = await serialize(MailAccountProfileTransformer.transform(profile))
    return response.ok(ApiResponse.success(serialized.data, 'Profile'))
  }

  async setupMailAccountProfile({ request, response, serialize }: HttpContext) {
    const { cuid, ...data } = await request.validateUsing(setupMailAccountProfileValidator)
    const mailAccount = await this.mailAccountService.findMailAccountByCuidOrFail(cuid)
    const profile = this.mailAccountProfileService.setupMailAccountProfile(mailAccount, data)
  }
}
