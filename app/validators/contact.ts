import vine from '@vinejs/vine'

// A contact needs at least a name and an email to be selectable when composing;
// everything else is supplementary detail.
export const createContactValidator = vine.create(
  vine.object({
    firstName: vine.string().trim().minLength(1).maxLength(100),
    lastName: vine.string().trim().maxLength(100).optional(),
    email: vine.string().email().trim().toLowerCase(),
    phone: vine.string().trim().maxLength(30).optional(),
    company: vine.string().trim().maxLength(150).optional(),
    notes: vine.string().trim().maxLength(2000).optional(),
  })
)

export const updateContactValidator = vine.create(
  vine.object({
    firstName: vine.string().trim().minLength(1).maxLength(100).optional(),
    lastName: vine.string().trim().maxLength(100).optional(),
    email: vine.string().email().trim().toLowerCase().optional(),
    phone: vine.string().trim().maxLength(30).optional(),
    company: vine.string().trim().maxLength(150).optional(),
    notes: vine.string().trim().maxLength(2000).optional(),
  })
)
