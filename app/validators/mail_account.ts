import vine from '@vinejs/vine'

export const createMailAccountValidator = vine.object({
  username: vine.string().minLength(3).maxLength(255),
  password: vine.string().minLength(6).maxLength(255),
  ownerEmail: vine.string().email().nullable(),
  domainId: vine.number(),
})

export const loginMailAccountValidator = vine.object({
  email: vine.string().email(),
  password: vine.string().minLength(6).maxLength(255),
})

export const createManyMailAccountsValidator = vine.create(
  vine.object({
    data: vine.array(
      vine.object({
        username: vine.string().minLength(3).maxLength(255),
        owner: vine.string().email(),
      })
    ),
  })
)
