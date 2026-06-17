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
