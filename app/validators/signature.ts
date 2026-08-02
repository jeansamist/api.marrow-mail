import vine from '@vinejs/vine'

export const signatureValidator = vine.create(
  vine.object({
    name: vine.string().trim().maxLength(150).optional(),
    jobTitle: vine.string().trim().maxLength(150).optional(),
    includePhoto: vine.boolean().optional(),
    phone: vine.string().trim().maxLength(30).optional(),
    website: vine.string().trim().maxLength(255).optional(),
    address: vine.string().trim().maxLength(255).optional(),
    linkedin: vine.string().trim().maxLength(255).optional(),
    facebook: vine.string().trim().maxLength(255).optional(),
    instagram: vine.string().trim().maxLength(255).optional(),
    includeInNewEmails: vine.boolean().optional(),
    includeInReplies: vine.boolean().optional(),
  })
)
