import { calcMailboxPricing } from '#utils/pricing'
import { test } from '@japa/runner'

test.group('calcMailboxPricing', () => {
  test('no discount for 1 mailbox / 1 month', ({ assert }) => {
    const result = calcMailboxPricing(1, 1, 'core')
    assert.equal(result.perMailboxPerMonth, 2500)
    assert.equal(result.total, 2500)
  })

  test('quantity discount only', ({ assert }) => {
    // count=3 -> 5% quantity discount, months=1 -> no duration discount
    const result = calcMailboxPricing(3, 1, 'core')
    assert.equal(result.perMailboxPerMonth, Math.round(2500 * 0.95))
    assert.equal(result.total, result.perMailboxPerMonth * 3)
  })

  test('duration discount only', ({ assert }) => {
    // months=12 -> 20% duration discount, count=1 -> no quantity discount
    const result = calcMailboxPricing(1, 12, 'plus')
    assert.equal(result.perMailboxPerMonth, Math.round(3500 * 0.8))
    assert.equal(result.total, result.perMailboxPerMonth * 1 * 12)
  })

  test('combined max discounts stack multiplicatively', ({ assert }) => {
    // count=11 -> 15% quantity discount, months=12 -> 20% duration discount
    const result = calcMailboxPricing(11, 12, 'plus')
    const expectedPerMailbox = Math.round(3500 * 0.8 * 0.85)
    assert.equal(result.perMailboxPerMonth, expectedPerMailbox)
    assert.equal(result.total, expectedPerMailbox * 11 * 12)
  })

  test('zero mailboxes returns zero total', ({ assert }) => {
    const result = calcMailboxPricing(0, 12, 'core')
    assert.equal(result.total, 0)
    assert.equal(result.perMailboxPerMonth, 2500)
  })
})
