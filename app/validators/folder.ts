import vine from '@vinejs/vine'

export const folderValidator = vine.create(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100),
  })
)
