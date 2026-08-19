import Domain from '#models/domain'
import MailAccount from '#models/mail_account'
import User from '#models/user'
import MailRepository from '#repositories/mail_repository'
import { ScheduledMailDispatchService } from '#services/scheduled_mail_dispatch_service'
import { type ModelProps } from '#utils/generics'
import { type MailSchema } from '#database/schema'
import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

test.group('ScheduledMailDispatchService', (group) => {
  const userEmail = 'dispatch-service.tester@example.com'
  let user: User
  let domain: Domain
  let mailAccount: MailAccount
  let mailRepository: MailRepository
  let dispatchService: ScheduledMailDispatchService

  function scheduledMailProps(
    overrides: Partial<ModelProps<MailSchema>> = {}
  ): ModelProps<MailSchema> {
    return {
      mailAccountId: mailAccount.id,
      fromEmail: 'placeholder@example.com',
      toAddresses: ['someone@example.com'],
      ccAddresses: null,
      bccAddresses: null,
      replyTo: null,
      subject: 'Scheduled mail',
      bodyHtml: null,
      bodyText: 'Body',
      status: 'scheduled',
      direction: 'sent',
      sesMessageId: null,
      attachmentIds: null,
      important: false,
      isSpam: false,
      isRead: true,
      failureReason: null,
      deleted: false,
      folderId: null,
      scheduledAt: DateTime.now().minus({ minutes: 1 }),
      ...overrides,
    }
  }

  group.setup(async () => {
    user = await User.create({
      firstName: 'Dispatch',
      lastName: 'Tester',
      email: userEmail,
      password: 'password',
    })
    domain = await Domain.create({
      name: 'dispatch-service-test.example.com',
      userId: user.id,
      verified: true,
    })
    mailAccount = await MailAccount.create({
      cuid: 'dispatch-service-test-account',
      username: 'dispatch-service-tester',
      password: 'password',
      setuped: true,
      userId: user.id,
      domainId: domain.id,
    })

    mailRepository = await app.container.make(MailRepository)
    dispatchService = await app.container.make(ScheduledMailDispatchService)
  })

  group.teardown(async () => {
    await mailAccount.delete()
    await domain.delete()
    await user.delete()
  })

  test('dispatchDueMails queues a due scheduled mail and leaves a future one alone', async ({
    assert,
  }) => {
    const due = await mailRepository.create(
      scheduledMailProps({ subject: 'Due', scheduledAt: DateTime.now().minus({ minutes: 1 }) })
    )
    const notDue = await mailRepository.create(
      scheduledMailProps({ subject: 'Not due', scheduledAt: DateTime.now().plus({ hours: 1 }) })
    )

    await dispatchService.dispatchDueMails()

    const dueAfter = await mailRepository.findById(due.id)
    const notDueAfter = await mailRepository.findById(notDue.id)

    assert.equal(dueAfter?.status, 'queued')
    assert.equal(notDueAfter?.status, 'scheduled')
  })

  test('dispatchDueMails marks a due mail with no recipients as failed', async ({ assert }) => {
    const invalid = await mailRepository.create(
      scheduledMailProps({
        subject: 'No recipients',
        toAddresses: null,
        scheduledAt: DateTime.now().minus({ minutes: 1 }),
      })
    )

    await dispatchService.dispatchDueMails()

    const after = await mailRepository.findById(invalid.id)
    assert.equal(after?.status, 'failed')
  })
})
