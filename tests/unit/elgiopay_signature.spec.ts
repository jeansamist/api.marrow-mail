import { ElgiopayService } from '#services/elgiopay_service'
import env from '#start/env'
import { test } from '@japa/runner'
import { createHmac } from 'node:crypto'

function signBody(t: number, rawBody: string) {
  return createHmac('sha256', env.get('ELGIOPAY_WEBHOOK_SECRET'))
    .update(`${t}.${rawBody}`)
    .digest('hex')
}

test.group('ElgiopayService.verifySignature', () => {
  const elgiopayService = new ElgiopayService()
  const rawBody = JSON.stringify({ id: 'evt_1', event: 'payment.completed', data: {} })

  test('accepts a correctly signed, fresh payload', ({ assert }) => {
    const t = Math.floor(Date.now() / 1000)
    const v1 = signBody(t, rawBody)

    assert.isTrue(elgiopayService.verifySignature(rawBody, `t=${t},v1=${v1}`))
  })

  test('rejects a tampered body', ({ assert }) => {
    const t = Math.floor(Date.now() / 1000)
    const v1 = signBody(t, rawBody)
    const tamperedBody = JSON.stringify({ id: 'evt_1', event: 'payment.failed', data: {} })

    assert.isFalse(elgiopayService.verifySignature(tamperedBody, `t=${t},v1=${v1}`))
  })

  test('rejects a signature computed with the wrong secret', ({ assert }) => {
    const t = Math.floor(Date.now() / 1000)
    const wrongSecretV1 = createHmac('sha256', 'not-the-real-secret')
      .update(`${t}.${rawBody}`)
      .digest('hex')

    assert.isFalse(elgiopayService.verifySignature(rawBody, `t=${t},v1=${wrongSecretV1}`))
  })

  test('rejects a stale timestamp older than 5 minutes', ({ assert }) => {
    const t = Math.floor(Date.now() / 1000) - 400
    const v1 = signBody(t, rawBody)

    assert.isFalse(elgiopayService.verifySignature(rawBody, `t=${t},v1=${v1}`))
  })
})
