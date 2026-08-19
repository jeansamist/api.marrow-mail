import vine from '@vinejs/vine'

export const setupMailAccountProfileValidator = vine.create(
  vine.object({
    firstName: vine.string().minLength(1).maxLength(255),
    lastName: vine.string().minLength(1).maxLength(255),
    avatar: vine.string().nullable(),
    cuid: vine.string().minLength(1),
    newPassword: vine.string().minLength(8),
  })
)

// The mail account is already resolved via JWT for this endpoint, so no cuid;
// password changes go through the separate change-password/reset-password
// flows, not profile edits.
export const updateMailAccountProfileValidator = vine.create(
  vine.object({
    firstName: vine.string().minLength(1).maxLength(255).optional(),
    lastName: vine.string().minLength(1).maxLength(255).optional(),
    avatar: vine.string().nullable().optional(),
  })
)
