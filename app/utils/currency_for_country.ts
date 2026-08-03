const CEMAC = new Set(['CM', 'GA', 'TD', 'CF', 'CG', 'GQ'])
const UEMOA = new Set(['SN', 'CI', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'])

export type ElgiopayCurrency = 'XAF' | 'XOF' | 'EUR'

export function resolveCurrencyForCountry(countryCode: string | null): ElgiopayCurrency {
  if (countryCode && CEMAC.has(countryCode)) return 'XAF'
  if (countryCode && UEMOA.has(countryCode)) return 'XOF'
  return 'EUR'
}
