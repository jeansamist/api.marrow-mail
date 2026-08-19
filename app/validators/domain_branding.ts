import vine from '@vinejs/vine'

export const updateDomainBrandingValidator = vine.create(
  vine.object({
    companyName: vine.string().trim().maxLength(150).nullable().optional(),
    welcomeMessage: vine.string().trim().maxLength(1000).nullable().optional(),
    accentColor: vine
      .string()
      .trim()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
      .nullable()
      .optional(),
    logoFileId: vine.number().nullable().optional(),
  })
)

export const createLogoUploadLinkValidator = vine.create(
  vine.object({
    originalName: vine.string().trim(),
    mimeType: vine.string().trim().optional(),
    size: vine.number().optional(),
  })
)
