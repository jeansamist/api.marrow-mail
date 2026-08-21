import vine from '@vinejs/vine'

const domainNameRule = vine
  .string()
  .trim()
  .minLength(3)
  .maxLength(255)
  .regex(/^(?=.{1,253}$)(?!-)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/)

export const searchDomainsValidator = vine.create(
  vine.object({
    slug: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(63)
      .regex(/^[a-z0-9-]+$/),
  })
)

const registrantContactValidator = vine.object({
  firstName: vine.string().trim().minLength(1).maxLength(255),
  lastName: vine.string().trim().minLength(1).maxLength(255),
  organizationName: vine.string().trim().maxLength(255).optional(),
  addressLine1: vine.string().trim().minLength(1).maxLength(255),
  addressLine2: vine.string().trim().maxLength(255).optional(),
  city: vine.string().trim().minLength(1).maxLength(255),
  state: vine.string().trim().maxLength(255).optional(),
  countryCode: vine.string().trim().fixedLength(2),
  zipCode: vine.string().trim().minLength(1).maxLength(20),
  phoneNumber: vine.string().trim().minLength(6).maxLength(30),
  email: vine.string().trim().email(),
})

export const createDomainPurchaseCheckoutValidator = vine.create(
  vine.object({
    domainName: domainNameRule,
    paymentMethod: vine.enum(['card', 'mtn_mobile_money', 'orange_money'] as const),
    customerPhone: vine.string().trim().minLength(6).maxLength(20).optional(),
    registrantContact: registrantContactValidator,
  })
)
