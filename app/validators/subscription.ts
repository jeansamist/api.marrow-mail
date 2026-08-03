import vine from '@vinejs/vine'

export const checkoutSubscriptionValidator = vine.create(
  vine.object({
    planId: vine.enum(['core', 'plus'] as const),
    mailboxQuantity: vine.number().min(1).max(200),
    billingMonths: vine.enum([1, 3, 6, 12] as const),
    paymentMethod: vine.enum(['card', 'mtn_mobile_money', 'orange_money'] as const),
    customerPhone: vine.string().trim().minLength(6).maxLength(20).optional(),
  })
)
