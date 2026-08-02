import Folder from '#models/folder'
import MailAccount from '#models/mail_account'
import User from '#models/user'
import MailRepository from '#repositories/mail_repository'
import { MailService } from '#services/mail_service'
import env from '#start/env'
import { type ModelProps } from '#utils/generics'
import { type MailSchema } from '#database/schema'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import jwt from 'jsonwebtoken'
import { DateTime } from 'luxon'
import { IncomingMessage } from 'node:http'
import { Socket } from 'node:net'

function httpStatus(error: unknown): number | undefined {
  return typeof error === 'object' && error !== null && 'status' in error
    ? (error as { status?: number }).status
    : undefined
}

async function bindMailAccountContext(mailAccountId: number) {
  const token = jwt.sign({ id: mailAccountId }, env.get('JWT_SECRET', 'key'))
  const req = new IncomingMessage(new Socket())
  req.headers = { authorization: `Bearer ${token}` }
  const ctx = await testUtils.createHttpContext({ req })
  app.container.bind(HttpContext, () => ctx)
}

test.group('MailService', (group) => {
  const userEmail = 'mail-service.tester@example.com'
  let user: User
  let mailAccount: MailAccount
  let mailService: MailService
  let mailRepository: MailRepository

  function seedMailProps(overrides: Partial<ModelProps<MailSchema>> = {}): ModelProps<MailSchema> {
    return {
      mailAccountId: mailAccount.id,
      fromEmail: 'someone@example.com',
      toAddresses: ['mail-service-tester@example.com'],
      ccAddresses: null,
      bccAddresses: null,
      replyTo: null,
      subject: 'Hello',
      bodyHtml: null,
      bodyText: null,
      status: 'received',
      direction: 'received',
      sesMessageId: null,
      attachmentIds: null,
      important: false,
      isSpam: false,
      deleted: false,
      folderId: null,
      scheduledAt: null,
      ...overrides,
    }
  }

  group.setup(async () => {
    user = await User.create({
      firstName: 'Mail',
      lastName: 'Tester',
      email: userEmail,
      password: 'password',
    })
    mailAccount = await MailAccount.create({
      cuid: 'mail-service-test-account',
      username: 'mail-service-tester',
      password: 'password',
      setuped: true,
      userId: user.id,
    })

    await bindMailAccountContext(mailAccount.id)
    mailService = await app.container.make(MailService)
    mailRepository = await app.container.make(MailRepository)
  })

  group.teardown(async () => {
    await mailAccount.delete()
    await user.delete()
  })

  test('saveDraft creates a draft with important, isSpam and deleted defaulted to false', async ({
    assert,
  }) => {
    const draft = await mailService.saveDraft({})

    assert.equal(draft.status, 'draft')
    assert.isNull(draft.toAddresses)
    assert.isNull(draft.subject)
    assert.isFalse(draft.important)
    assert.isFalse(draft.isSpam)
    assert.isFalse(draft.deleted)
  })

  test('fetchAllMail and fetchAllSentMail exclude deleted mail', async ({ assert }) => {
    const kept = await mailRepository.create(
      seedMailProps({ subject: 'Kept', status: 'sent', direction: 'sent' })
    )
    const trashed = await mailRepository.create(
      seedMailProps({ subject: 'Trashed', status: 'sent', direction: 'sent' })
    )
    await mailRepository.update(trashed, { deleted: true })

    const all = await mailService.fetchAllMail()
    const sent = await mailService.fetchAllSentMail()

    assert.isTrue(all.some((m) => m.id === kept.id))
    assert.isFalse(all.some((m) => m.id === trashed.id))
    assert.isTrue(sent.some((m) => m.id === kept.id))
    assert.isFalse(sent.some((m) => m.id === trashed.id))
  })

  test('fetchAllMail excludes drafts while fetchDrafts only returns drafts', async ({ assert }) => {
    const draft = await mailService.saveDraft({ subject: 'A draft' })

    const all = await mailService.fetchAllMail()
    const drafts = await mailService.fetchDrafts()

    assert.isFalse(all.some((m) => m.id === draft.id))
    assert.isTrue(drafts.some((m) => m.id === draft.id))
  })

  test('updateDraft partially updates a draft and deleteDraft removes it', async ({ assert }) => {
    const draft = await mailService.saveDraft({ subject: 'Original' })

    const updated = await mailService.updateDraft(draft.id, { subject: 'Updated' })
    assert.equal(updated.subject, 'Updated')

    await mailService.deleteDraft(draft.id)
    const drafts = await mailService.fetchDrafts()
    assert.isFalse(drafts.some((m) => m.id === draft.id))
  })

  test('sendDraft rejects a draft missing recipients or a subject', async ({ assert }) => {
    const draft = await mailService.saveDraft({})

    try {
      await mailService.sendDraft(draft.id)
      assert.fail('Expected sendDraft to reject a draft with no recipients')
    } catch (error) {
      assert.equal(httpStatus(error), 422)
    }

    const withRecipient = await mailService.updateDraft(draft.id, {
      to: ['someone@example.com'],
    })

    try {
      await mailService.sendDraft(withRecipient.id)
      assert.fail('Expected sendDraft to reject a draft with no subject')
    } catch (error) {
      assert.equal(httpStatus(error), 422)
    }
  })

  test('sendDraft queues a complete draft for sending', async ({ assert }) => {
    const draft = await mailService.saveDraft({ to: ['someone@example.com'], subject: 'Hello' })

    const sent = await mailService.sendDraft(draft.id)

    assert.equal(sent.status, 'queued')
  })

  test('moveToFolder files mail into an owned folder and rejects an unknown one', async ({
    assert,
  }) => {
    const folder = await Folder.create({ name: 'Clients', mailAccountId: mailAccount.id })
    const draft = await mailService.saveDraft({ subject: 'To file' })

    const moved = await mailService.moveToFolder(draft.id, folder.id)
    assert.equal(moved.folderId, folder.id)

    try {
      await mailService.moveToFolder(draft.id, 999999)
      assert.fail('Expected moveToFolder to reject an unknown folder')
    } catch (error) {
      assert.equal(httpStatus(error), 404)
    }

    await folder.delete()
  })

  test('markSpam and markImportant toggle their respective flags', async ({ assert }) => {
    const draft = await mailService.saveDraft({ subject: 'Flaggable' })

    const spammed = await mailService.markSpam(draft.id, true)
    assert.isTrue(spammed.isSpam)

    const starred = await mailService.markImportant(draft.id, true)
    assert.isTrue(starred.important)
  })

  test('forwardMail prefixes the subject and quotes the original body', async ({ assert }) => {
    const original = await mailRepository.create(
      seedMailProps({ subject: 'Quarterly report', bodyText: 'Here is the report.' })
    )

    const forwarded = await mailService.forwardMail(original.id, { to: ['someone@example.com'] })

    assert.equal(forwarded.subject, 'Fwd: Quarterly report')
    assert.include(forwarded.bodyText ?? '', 'Here is the report.')
  })

  test('mail actions are rejected for mail belonging to another mail account', async ({
    assert,
  }) => {
    const otherUser = await User.create({
      firstName: 'Other',
      lastName: 'Tester',
      email: 'mail-service.other@example.com',
      password: 'password',
    })
    const otherMailAccount = await MailAccount.create({
      cuid: 'mail-service-other-account',
      username: 'mail-service-other',
      password: 'password',
      setuped: true,
      userId: otherUser.id,
    })
    const foreignMail = await mailRepository.create(
      seedMailProps({ subject: 'Not yours', mailAccountId: otherMailAccount.id })
    )

    try {
      await mailService.markImportant(foreignMail.id, true)
      assert.fail('Expected markImportant to reject mail owned by another mail account')
    } catch (error) {
      assert.equal(httpStatus(error), 404)
    }

    await otherMailAccount.delete()
    await otherUser.delete()
  })

  test('scheduleMail rejects a scheduledAt that is not in the future', async ({ assert }) => {
    try {
      await mailService.scheduleMail({
        to: ['someone@example.com'],
        subject: 'Too late',
        scheduledAt: DateTime.now().minus({ minutes: 5 }),
      })
      assert.fail('Expected scheduleMail to reject a past scheduledAt')
    } catch (error) {
      assert.equal(httpStatus(error), 422)
    }
  })

  test('scheduleMail creates a scheduled mail excluded from other mailboxes', async ({
    assert,
  }) => {
    const scheduledAt = DateTime.now().plus({ hours: 1 })
    const scheduled = await mailService.scheduleMail({
      to: ['someone@example.com'],
      subject: 'Future mail',
      scheduledAt,
    })

    assert.equal(scheduled.status, 'scheduled')
    assert.isTrue(scheduledAt.equals(scheduled.scheduledAt!))

    const scheduledList = await mailService.fetchScheduledMails()
    const all = await mailService.fetchAllMail()
    const sent = await mailService.fetchAllSentMail()

    assert.isTrue(scheduledList.some((m) => m.id === scheduled.id))
    assert.isFalse(all.some((m) => m.id === scheduled.id))
    assert.isFalse(sent.some((m) => m.id === scheduled.id))
  })

  test('rescheduleMail changes the send time and rejects a past date', async ({ assert }) => {
    const scheduled = await mailService.scheduleMail({
      to: ['someone@example.com'],
      subject: 'Reschedule me',
      scheduledAt: DateTime.now().plus({ hours: 1 }),
    })

    const newTime = DateTime.now().plus({ days: 1 })
    const rescheduled = await mailService.rescheduleMail(scheduled.id, newTime)
    assert.isTrue(newTime.equals(rescheduled.scheduledAt!))

    try {
      await mailService.rescheduleMail(scheduled.id, DateTime.now().minus({ minutes: 1 }))
      assert.fail('Expected rescheduleMail to reject a past scheduledAt')
    } catch (error) {
      assert.equal(httpStatus(error), 422)
    }
  })

  test('cancelScheduledMail reverts a scheduled mail back to a draft', async ({ assert }) => {
    const scheduled = await mailService.scheduleMail({
      to: ['someone@example.com'],
      subject: 'Cancel me',
      scheduledAt: DateTime.now().plus({ hours: 1 }),
    })

    const canceled = await mailService.cancelScheduledMail(scheduled.id)

    assert.equal(canceled.status, 'draft')
    assert.isNull(canceled.scheduledAt)

    const drafts = await mailService.fetchDrafts()
    const scheduledList = await mailService.fetchScheduledMails()
    assert.isTrue(drafts.some((m) => m.id === canceled.id))
    assert.isFalse(scheduledList.some((m) => m.id === canceled.id))
  })
})
