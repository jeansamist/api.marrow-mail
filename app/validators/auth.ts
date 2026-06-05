import vine from '@vinejs/vine'
import { createUserValidator } from './user.js'

export const signUpValidator = createUserValidator

export const signInValidator = vine.create(
  vine.object({
    email: vine.string().email().trim().toLowerCase(),
    password: vine.string().minLength(8),
  })
)

export const forgotPasswordValidator = vine.create(
  vine.object({
    email: vine.string().trim(),
  })
)

export const resetPasswordValidator = vine.create(
  vine.object({
    email: vine.string().email().trim().toLowerCase(),
    resetPasswordToken: vine.string().minLength(4),
    newPassword: vine.string().minLength(8),
  })
)

export const verifyEmailValidator = vine.create(
  vine.object({
    email: vine.string().email().trim().toLowerCase().normalizeEmail(),
    emailVerificationCode: vine.string().minLength(6),
  })
)
