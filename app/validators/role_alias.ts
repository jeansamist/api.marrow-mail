import vine from '@vinejs/vine'

export const createRoleAliasValidator = vine.create(
  vine.object({
    alias: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(64)
      .regex(/^[a-zA-Z0-9._-]+$/),
    mailAccountId: vine.number(),
  })
)
