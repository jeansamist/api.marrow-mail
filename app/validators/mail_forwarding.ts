import vine from '@vinejs/vine'

export const setForwardingEmailValidator = vine.create(
  vine.object({
    forwardingEmail: vine.string().email().trim().toLowerCase(),
  })
)

export const verifyForwardingEmailValidator = vine.create(
  vine.object({
    token: vine.string().minLength(1),
  })
)

export const updateForwardingPreferencesValidator = vine.create(
  vine.object({
    keepForwardedCopy: vine.boolean(),
  })
)
