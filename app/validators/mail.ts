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

export const moveMailToFolderValidator = vine.create(
  vine.object({
    folderId: vine.number().nullable(),
  })
)

export const markSpamValidator = vine.create(
  vine.object({
    isSpam: vine.boolean(),
  })
)

export const markImportantValidator = vine.create(
  vine.object({
    important: vine.boolean(),
  })
)

// Forwarding always needs at least one recipient; everything else (an extra
// note from the forwarder) is optional, same shape as sendMailValidator minus subject.
export const forwardMailValidator = vine.create(
  vine.object({
    to: vine.array(vine.string().email().trim().toLowerCase()).minLength(1),
    cc: vine.array(vine.string().email().trim().toLowerCase()).optional(),
    bcc: vine.array(vine.string().email().trim().toLowerCase()).optional(),
    replyTo: vine.string().email().trim().toLowerCase().optional(),
    bodyHtml: vine.string().optional(),
    bodyText: vine.string().optional(),
  })
)

// scheduledAt only needs to be a parseable date here — "must be in the
// future" is a business rule enforced in MailService, not a format concern.
export const scheduleMailValidator = vine.create(
  vine.object({
    to: vine.array(vine.string().email().trim().toLowerCase()).minLength(1),
    cc: vine.array(vine.string().email().trim().toLowerCase()).optional(),
    bcc: vine.array(vine.string().email().trim().toLowerCase()).optional(),
    replyTo: vine.string().email().trim().toLowerCase().optional(),
    subject: vine.string().trim(),
    bodyHtml: vine.string().optional(),
    bodyText: vine.string().optional(),
    scheduledAt: vine.date(),
  })
)

export const rescheduleMailValidator = vine.create(
  vine.object({
    scheduledAt: vine.date(),
  })
)
