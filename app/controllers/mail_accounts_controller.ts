import { MailAccountService } from '#services/mail_account_service'
import MailAccountTransformer from '#transformers/mail_account_transformer'
import { ApiResponse } from '#utils/api_response'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class MailAccountsController {
  constructor(private readonly mailAccountService: MailAccountService) {}

  async index({ response, serialize }: HttpContext) {
    const mailAccounts = await this.mailAccountService.listMailAccountsForCurrentUser()
    const serialized = await serialize(MailAccountTransformer.transform(mailAccounts))
    return response.ok(ApiResponse.success(serialized.data, 'Mail accounts retrieved'))
  }

  async destroy({ params, response }: HttpContext) {
    await this.mailAccountService.deleteMailAccount(Number(params.id))
    return response.ok(ApiResponse.success(null, 'Mail account deleted'))
  }
}
