import vine from '@vinejs/vine'

export const createDomainValidator = vine.create(
  vine.object({
    name: vine
      .string()
      .minLength(3)
      .maxLength(255)
      .regex(/^(?=.{1,253}$)(?!-)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/),
  })
)
