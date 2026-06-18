import vine from '@vinejs/vine'

export const sendMailValidator = vine.create(
  vine.object({
    to: vine.array(vine.string().email().trim().toLowerCase()).minLength(1),
    cc: vine.array(vine.string().email().trim().toLowerCase()).optional(),
    bcc: vine.array(vine.string().email().trim().toLowerCase()).optional(),
    replyTo: vine.string().email().trim().toLowerCase().optional(),
    subject: vine.string().trim(),
    bodyHtml: vine.string().optional(),
    bodyText: vine.string().optional(),
  })
)
