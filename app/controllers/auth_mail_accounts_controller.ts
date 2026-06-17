import { MailAccountService } from '#services/mail_account_service'
import { ApiResponse } from '#utils/api_response'
import { signInValidator } from '#validators/auth'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class AuthMailAccountsController {
  constructor(private readonly mailAccountService: MailAccountService) {}
  async login({ request, response }: HttpContext) {
    const data = await request.validateUsing(signInValidator)
    const mailAccount = await this.mailAccountService.login(data)
    const jwt = await this.mailAccountService.generateJWT(mailAccount)
    return response.ok(ApiResponse.success({ ...jwt }, 'Login success'))
  }
}
