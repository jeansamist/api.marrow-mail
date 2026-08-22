import vine from '@vinejs/vine'

const fileDescriptor = vine.object({
  originalName: vine.string().trim(),
  mimeType: vine.string().trim().optional(),
  size: vine.number().optional(),
  kind: vine.enum(['file', 'voice_note'] as const).optional(),
})

export const createUploadLinkValidator = vine.create(fileDescriptor)

export const createUploadLinksValidator = vine.create(
  vine.object({
    files: vine.array(fileDescriptor).minLength(1).maxLength(20),
  })
)

export const createStorageAddonCheckoutValidator = vine.create(
  vine.object({
    mailAccountId: vine.number(),
    extraGB: vine.number().min(1).max(1000),
    paymentMethod: vine.enum(['card', 'mtn_mobile_money', 'orange_money'] as const),
    customerPhone: vine.string().trim().minLength(6).maxLength(20).optional(),
  })
)
