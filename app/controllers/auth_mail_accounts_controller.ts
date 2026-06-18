import { AuthMailAccountService } from '#services/auth_mail_account_service'
import { ApiResponse } from '#utils/api_response'
import { forgotPasswordValidator, resetPasswordValidator, signInValidator } from '#validators/auth'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class AuthMailAccountsController {
  constructor(private readonly authMailAccountService: AuthMailAccountService) {}

  async login({ request, response }: HttpContext) {
    const data = await request.validateUsing(signInValidator)
    const mailAccount = await this.authMailAccountService.login(data)
    const jwt = await this.authMailAccountService.generateJWT(mailAccount)
    return response.ok(ApiResponse.success({ ...jwt }, 'Login success'))
  }

  async forgotPassword({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)
    await this.authMailAccountService.forgotPassword(email)
    return response.ok(ApiResponse.success(null, 'Password reset email sent'))
  }

  async resetPassword({ request, response }: HttpContext) {
    const data = await request.validateUsing(resetPasswordValidator)
    const success = await this.authMailAccountService.resetPassword(data)
    if (!success) {
      return response.badRequest(ApiResponse.failure(null, 'Invalid or expired reset token'))
    }
    return response.ok(ApiResponse.success(null, 'Password reset successfully'))
  }

  async profile({ response }: HttpContext) {
    const profile = await this.authMailAccountService.profile()
    return response.ok(ApiResponse.success(profile, 'Profile loaded'))
  }
}
