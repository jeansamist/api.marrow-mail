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

// Drafts may be saved incomplete (e.g. no recipients or subject yet),
// so every field is optional here unlike sendMailValidator.
export const draftMailValidator = vine.create(
  vine.object({
    to: vine.array(vine.string().email().trim().toLowerCase()).optional(),
    cc: vine.array(vine.string().email().trim().toLowerCase()).optional(),
    bcc: vine.array(vine.string().email().trim().toLowerCase()).optional(),
    replyTo: vine.string().email().trim().toLowerCase().optional(),
    subject: vine.string().trim().optional(),
    bodyHtml: vine.string().optional(),
    bodyText: vine.string().optional(),
  })
)
