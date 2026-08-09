import vine from '@vinejs/vine'

/**
 * Shared rules for email and password.
 */

/**
 * Validator to use when performing self-signup
 */
export const createUserValidator = vine.create({
  firstName: vine.string().minLength(2),
  lastName: vine.string().minLength(2),
  businessName: vine.string().trim().optional(),
  email: vine.string().trim().email().normalizeEmail(),
  password: vine.string().minLength(8),
})

export const updateUserValidator = vine.create(
  vine.object({
    avatar: vine.string().optional(),
    firstName: vine.string().optional(),
    lastName: vine.string().optional(),
    businessName: vine.string().trim().optional(),
  })
)
