import { AuthService } from '#services/auth_service'
import UserTransformer from '#transformers/user_transformer'
import { ApiResponse } from '#utils/api_response'
import {
  forgotPasswordValidator,
  resetPasswordValidator,
  signInValidator,
  signUpValidator,
  verifyEmailValidator,
} from '#validators/auth'
import { updateUserValidator } from '#validators/user'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class AuthController {
  constructor(protected authService: AuthService) {}
  async signUp({ request, response, auth }: HttpContext) {
    if (auth.isAuthenticated) {
      return response.conflict(ApiResponse.failure(null, 'You can not sign up while logged in'))
    }
    const data = await request.validateUsing(signUpValidator)
    await this.authService.signUp(data)
    return response.ok(ApiResponse.success(null, 'User created successfully'))
  }

  async verifyEmail({ request, response, auth }: HttpContext) {
    if (auth.isAuthenticated) {
      return response.conflict(
        ApiResponse.failure(null, 'You can not reverify email while logged in')
      )
    }
    const { email, emailVerificationCode } = await request.validateUsing(verifyEmailValidator)
    const user = await this.authService.verifyEmail(email, emailVerificationCode)
    if (user) {
      const accessToken = await this.authService.generateAccessToken(user, auth)
      return response.ok(ApiResponse.success({ accessToken }, 'Email verified successfully'))
    }
    return response.badRequest(ApiResponse.failure(null, 'Invalid email verification code'))
  }

  async signIn({ request, response, auth }: HttpContext) {
    if (auth.isAuthenticated) {
      return response.conflict(ApiResponse.failure(null, 'You can not sign in while logged in'))
    }
    const data = await request.validateUsing(signInValidator)
    const user = await this.authService.signIn(data)
    const accessToken = await this.authService.generateAccessToken(user, auth)
    return response.ok(ApiResponse.success({ accessToken }, 'Signed in successfully'))
  }

  async forgotPassword({ request, response, auth }: HttpContext) {
    if (auth.isAuthenticated) {
      return response.conflict(ApiResponse.failure(null, 'You can not proceed while logged in'))
    }
    const { email } = await request.validateUsing(forgotPasswordValidator)
    await this.authService.forgotPassword(email)
    return response.ok(ApiResponse.success(null, 'Password reset email sent successfully'))
  }

  async resetPassword({ request, response, auth }: HttpContext) {
    if (auth.isAuthenticated) {
      return response.conflict(ApiResponse.failure(null, 'You can not proceed while logged in'))
    }
    const data = await request.validateUsing(resetPasswordValidator)
    const success = await this.authService.resetPassword(data)
    if (success) {
      return response.ok(ApiResponse.success(null, 'Password resets successfully'))
    }
    return response.badRequest(ApiResponse.failure(null, 'Invalid request'))
  }
  public async logout({ response, auth }: HttpContext) {
    await this.authService.deleteAccessToken(auth)
    return response.ok(ApiResponse.success(null, 'User logged out successfully'))
  }

  public async deleteAccount({ response, auth }: HttpContext) {
    if (!auth.user) return response.unauthorized(ApiResponse.failure(null, 'You are not logged in'))
    await this.authService.deleteAccessToken(auth)
    await this.authService.deleteAccount(auth.user)
    return response.ok(ApiResponse.success(null, 'Account deleted successfully'))
  }

  public async profile({ response, auth, serialize }: HttpContext) {
    if (!auth.user) return response.unauthorized(ApiResponse.failure(null, 'You are not logged in'))
    const serialized = await serialize(UserTransformer.transform(auth.user))
    return await response.ok(ApiResponse.success(serialized.data, 'User profile'))
  }
  public async updateProfile({ request, response, serialize, auth }: HttpContext) {
    if (!auth.user) return response.unauthorized(ApiResponse.failure(null, 'You are not logged in'))

    try {
      const payload = await request.validateUsing(updateUserValidator)
      const updatedUser = await this.authService.updateProfile(auth.user, payload)
      const serialized = await serialize(UserTransformer.transform(updatedUser))
      return response.ok(ApiResponse.success(serialized.data, 'Profile updated successfully'))
    } catch (error_) {
      const error = error_ instanceof Error ? error_ : new Error('Unknown error')
      return response.badRequest(
        ApiResponse.failure(null, error.message || 'Failed to update profile')
      )
    }
  }
}
