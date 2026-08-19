import { MailForwardingService } from '#services/mail_forwarding_service'
import { ApiResponse } from '#utils/api_response'
import {
  setForwardingEmailValidator,
  updateForwardingPreferencesValidator,
  verifyForwardingEmailValidator,
} from '#validators/mail_forwarding'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class MailForwardingController {
  constructor(private readonly mailForwardingService: MailForwardingService) {}

  async setForwardingEmail({ request, response }: HttpContext) {
    const { forwardingEmail } = await request.validateUsing(setForwardingEmailValidator)
    await this.mailForwardingService.setForwardingEmail(forwardingEmail)
    return response.ok(ApiResponse.success(null, 'Verification email sent'))
  }

  async verify({ request, response }: HttpContext) {
    const { token } = await request.validateUsing(verifyForwardingEmailValidator)
    const verified = await this.mailForwardingService.verifyForwardingEmail(token)
    if (!verified) {
      return response.badRequest(ApiResponse.failure(null, 'Invalid or expired verification link'))
    }
    return response.ok(ApiResponse.success(null, 'Forwarding address verified'))
  }

  async updatePreferences({ request, response }: HttpContext) {
    const { keepForwardedCopy } = await request.validateUsing(updateForwardingPreferencesValidator)
    await this.mailForwardingService.updatePreferences(keepForwardedCopy)
    return response.ok(ApiResponse.success(null, 'Preferences updated'))
  }
}
