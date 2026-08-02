import MailAccount from '#models/mail_account'
import User from '#models/user'
import { SignatureService } from '#services/signature_service'
import env from '#start/env'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import jwt from 'jsonwebtoken'
import { IncomingMessage } from 'node:http'
import { Socket } from 'node:net'

async function bindMailAccountContext(mailAccountId: number) {
  const token = jwt.sign({ id: mailAccountId }, env.get('JWT_SECRET', 'key'))
  const req = new IncomingMessage(new Socket())
  req.headers = { authorization: `Bearer ${token}` }
  const ctx = await testUtils.createHttpContext({ req })
  app.container.bind(HttpContext, () => ctx)
}

test.group('SignatureService', (group) => {
  const userEmail = 'signature-service.tester@example.com'
  let user: User
  let mailAccount: MailAccount
  let signatureService: SignatureService

  group.setup(async () => {
    user = await User.create({
      firstName: 'Signature',
      lastName: 'Tester',
      email: userEmail,
      password: 'password',
    })
    mailAccount = await MailAccount.create({
      cuid: 'signature-service-test-account',
      username: 'signature-service-tester',
      password: 'password',
      setuped: true,
      userId: user.id,
    })

    await bindMailAccountContext(mailAccount.id)
    signatureService = await app.container.make(SignatureService)
  })

  group.teardown(async () => {
    await mailAccount.delete()
    await user.delete()
  })

  test('getSignature returns null before any signature is created', async ({ assert }) => {
    const signature = await signatureService.getSignature()
    assert.isNull(signature)
  })

  test('upsertSignature creates a signature on first call', async ({ assert }) => {
    const signature = await signatureService.upsertSignature({
      name: 'Ada Lovelace',
      jobTitle: 'Engineer',
    })

    assert.equal(signature.mailAccountId, mailAccount.id)
    assert.equal(signature.name, 'Ada Lovelace')
    assert.equal(signature.jobTitle, 'Engineer')
    assert.isFalse(signature.includePhoto)
    assert.isTrue(signature.includeInNewEmails)
    assert.isTrue(signature.includeInReplies)
  })

  test('upsertSignature updates the existing signature rather than duplicating it', async ({
    assert,
  }) => {
    const created = await signatureService.upsertSignature({ name: 'First name' })
    const updated = await signatureService.upsertSignature({ name: 'Second name' })

    assert.equal(created.id, updated.id)
    assert.equal(updated.name, 'Second name')

    const fetched = await signatureService.getSignature()
    assert.equal(fetched?.id, created.id)
    assert.equal(fetched?.name, 'Second name')
  })

  test('signatures are isolated per mail account', async ({ assert }) => {
    const otherUser = await User.create({
      firstName: 'Other',
      lastName: 'Tester',
      email: 'signature-service.other@example.com',
      password: 'password',
    })
    const otherMailAccount = await MailAccount.create({
      cuid: 'signature-service-other-account',
      username: 'signature-service-other',
      password: 'password',
      setuped: true,
      userId: otherUser.id,
    })

    await bindMailAccountContext(otherMailAccount.id)
    const otherSignatureService = await app.container.make(SignatureService)
    await otherSignatureService.upsertSignature({ name: 'Not yours' })

    await bindMailAccountContext(mailAccount.id)
    signatureService = await app.container.make(SignatureService)

    const signature = await signatureService.getSignature()
    assert.isTrue(signature === null || signature.name !== 'Not yours')

    await otherMailAccount.delete()
    await otherUser.delete()
  })
})
