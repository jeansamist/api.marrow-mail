// Mirrors marrowmails/lib/onboarding.ts's calcMailboxPricing() exactly.
// Keep the two in sync manually — there is no shared package between the two repos.

export const PLAN_BASE_PRICE_XAF = { core: 2500, plus: 3500 } as const

// Applied when a mail account has no explicit storageQuotaBytes override.
export const DEFAULT_MAILBOX_STORAGE_BYTES = 5 * 1024 * 1024 * 1024

export type PlanId = keyof typeof PLAN_BASE_PRICE_XAF

function getDurationDiscount(months: number): number {
  if (months >= 12) return 0.2
  if (months >= 6) return 0.12
  if (months >= 3) return 0.05
  return 0
}

function getQuantityDiscount(count: number): number {
  if (count >= 11) return 0.15
  if (count >= 6) return 0.1
  if (count >= 3) return 0.05
  return 0
}

export function calcMailboxPricing(count: number, months: number, planId: PlanId) {
  const basePrice = PLAN_BASE_PRICE_XAF[planId]
  if (count <= 0) return { perMailboxPerMonth: basePrice, total: 0 }

  const multiplier = (1 - getDurationDiscount(months)) * (1 - getQuantityDiscount(count))
  const perMailboxPerMonth = Math.round(basePrice * multiplier)

  return { perMailboxPerMonth, total: perMailboxPerMonth * count * months }
}
