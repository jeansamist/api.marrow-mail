import { AuthMailAccountService } from '#services/auth_mail_account_service'
import { TwoFactorService } from '#services/two_factor_service'
import { ApiResponse } from '#utils/api_response'
import {
  changePasswordValidator,
  disableTwoFactorValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  signInValidator,
  twoFactorCodeValidator,
  verifyTwoFactorValidator,
} from '#validators/auth'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class AuthMailAccountsController {
  constructor(
    private readonly authMailAccountService: AuthMailAccountService,
    private readonly twoFactorService: TwoFactorService
  ) {}

  async login({ request, response }: HttpContext) {
    const data = await request.validateUsing(signInValidator)
    const mailAccount = await this.authMailAccountService.login(data)

    if (mailAccount.twoFactorEnabled) {
      const challenge = this.authMailAccountService.generateTwoFactorChallenge(mailAccount)
      return response.ok(
        ApiResponse.success(
          { requiresTwoFactor: true, ...challenge },
          'Two-factor verification required'
        )
      )
    }

    const jwtResult = await this.authMailAccountService.generateJWT(mailAccount)
    return response.ok(
      ApiResponse.success({ requiresTwoFactor: false, ...jwtResult }, 'Login success')
    )
  }

  async verifyTwoFactor({ request, response }: HttpContext) {
    const { challengeToken, code } = await request.validateUsing(verifyTwoFactorValidator)
    const jwtResult = await this.authMailAccountService.verifyTwoFactorChallenge(
      challengeToken,
      code
    )
    return response.ok(ApiResponse.success({ ...jwtResult }, 'Login success'))
  }

  async setupTwoFactor({ response }: HttpContext) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    const setup = await this.twoFactorService.setup(mailAccount)
    return response.ok(ApiResponse.success(setup, 'Scan the QR code with your authenticator app'))
  }

  async enableTwoFactor({ request, response }: HttpContext) {
    const { code } = await request.validateUsing(twoFactorCodeValidator)
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    await this.twoFactorService.enable(mailAccount, code)
    return response.ok(ApiResponse.success(null, 'Two-factor authentication enabled'))
  }

  async disableTwoFactor({ request, response }: HttpContext) {
    const { currentPassword, code } = await request.validateUsing(disableTwoFactorValidator)
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    await this.twoFactorService.disable(mailAccount, currentPassword, code)
    return response.ok(ApiResponse.success(null, 'Two-factor authentication disabled'))
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

  async changePassword({ request, response }: HttpContext) {
    const { currentPassword, newPassword } = await request.validateUsing(changePasswordValidator)
    await this.authMailAccountService.changePassword(currentPassword, newPassword)
    return response.ok(ApiResponse.success(null, 'Password changed successfully'))
  }
}
