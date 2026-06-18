import vine from '@vinejs/vine'

const fileDescriptor = vine.object({
  originalName: vine.string().trim(),
  mimeType: vine.string().trim().optional(),
  size: vine.number().optional(),
})

export const createUploadLinkValidator = vine.create(fileDescriptor)

export const createUploadLinksValidator = vine.create(
  vine.object({
    files: vine.array(fileDescriptor).minLength(1).maxLength(20),
  })
)
