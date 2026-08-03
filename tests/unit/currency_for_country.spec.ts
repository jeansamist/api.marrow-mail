import { resolveCurrencyForCountry } from '#utils/currency_for_country'
import { test } from '@japa/runner'

test.group('resolveCurrencyForCountry', () => {
  test('CEMAC country resolves to XAF', ({ assert }) => {
    assert.equal(resolveCurrencyForCountry('CM'), 'XAF')
  })

  test('UEMOA country resolves to XOF', ({ assert }) => {
    assert.equal(resolveCurrencyForCountry('SN'), 'XOF')
  })

  test('unknown country falls back to EUR', ({ assert }) => {
    assert.equal(resolveCurrencyForCountry('US'), 'EUR')
  })

  test('null country falls back to EUR', ({ assert }) => {
    assert.equal(resolveCurrencyForCountry(null), 'EUR')
  })
})
