import vine from '@vinejs/vine'

export const setCustomLoginHostnameValidator = vine.create(
  vine.object({
    hostname: vine
      .string()
      .trim()
      .minLength(3)
      .maxLength(255)
      .regex(/^(?=.{1,253}$)(?!-)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/),
  })
)
