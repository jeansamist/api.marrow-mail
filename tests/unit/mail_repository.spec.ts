import Folder from '#models/folder'
import MailAccount from '#models/mail_account'
import User from '#models/user'
import MailRepository from '#repositories/mail_repository'
import { type ModelProps } from '#utils/generics'
import { type MailSchema } from '#database/schema'
import { test } from '@japa/runner'

test.group('MailRepository', (group) => {
  const mailRepository = new MailRepository()
  const userEmail = 'mail-repo.tester@example.com'
  let user: User
  let mailAccount: MailAccount

  function mailProps(overrides: Partial<ModelProps<MailSchema>>): ModelProps<MailSchema> {
    return {
      mailAccountId: mailAccount.id,
      fromEmail: 'someone@example.com',
      toAddresses: ['mail-repo-tester@example.com'],
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
      cuid: 'mail-repo-test-account',
      username: 'mail-repo-tester',
      password: 'password',
      setuped: true,
      userId: user.id,
    })
  })

  group.teardown(async () => {
    await mailAccount.delete()
    await user.delete()
  })

  test('a newly created mail defaults important, isSpam and deleted to false', async ({
    assert,
  }) => {
    const mail = await mailRepository.create(mailProps({ subject: 'Hello' }))

    assert.isFalse(mail.important)
    assert.isFalse(mail.isSpam)
    assert.isFalse(mail.deleted)
  })

  test('findByMailAccount excludes deleted mail', async ({ assert }) => {
    const kept = await mailRepository.create(mailProps({ subject: 'Kept' }))
    const trashed = await mailRepository.create(mailProps({ subject: 'Trashed' }))
    await mailRepository.update(trashed, { deleted: true })

    const result = await mailRepository.findByMailAccount(mailAccount.id)

    assert.isTrue(result.some((mail) => mail.id === kept.id))
    assert.isFalse(result.some((mail) => mail.id === trashed.id))
  })

  test('findByMailAccountAndDirection excludes deleted mail', async ({ assert }) => {
    const sent = await mailRepository.create(
      mailProps({
        subject: 'Sent and trashed',
        fromEmail: 'mail-repo-tester@example.com',
        toAddresses: ['someone@example.com'],
        status: 'sent',
        direction: 'sent',
      })
    )
    await mailRepository.update(sent, { deleted: true })

    const result = await mailRepository.findByMailAccountAndDirection(mailAccount.id, 'sent')

    assert.isFalse(result.some((mail) => mail.id === sent.id))
  })

  test('a draft can be saved without recipients or a subject', async ({ assert }) => {
    const draft = await mailRepository.create(
      mailProps({ toAddresses: null, subject: null, status: 'draft' })
    )

    assert.isNull(draft.toAddresses)
    assert.isNull(draft.subject)
    assert.equal(draft.status, 'draft')
  })

  test('findDraftsByMailAccount only returns drafts, not sent/received mail', async ({
    assert,
  }) => {
    const draft = await mailRepository.create(mailProps({ subject: 'A draft', status: 'draft' }))
    const received = await mailRepository.create(
      mailProps({ subject: 'Inbox message', status: 'received', direction: 'received' })
    )

    const result = await mailRepository.findDraftsByMailAccount(mailAccount.id)

    assert.isTrue(result.some((mail) => mail.id === draft.id))
    assert.isFalse(result.some((mail) => mail.id === received.id))
  })

  test('findByMailAccount and findByMailAccountAndDirection exclude drafts', async ({ assert }) => {
    const draft = await mailRepository.create(
      mailProps({ subject: 'Hidden draft', status: 'draft' })
    )

    const all = await mailRepository.findByMailAccount(mailAccount.id)
    const sent = await mailRepository.findByMailAccountAndDirection(mailAccount.id, 'sent')

    assert.isFalse(all.some((mail) => mail.id === draft.id))
    assert.isFalse(sent.some((mail) => mail.id === draft.id))
  })

  test('findByFolder only returns mail filed into that folder', async ({ assert }) => {
    const folder = await Folder.create({
      name: 'Clients',
      mailAccountId: mailAccount.id,
    })

    const filed = await mailRepository.create(mailProps({ subject: 'Filed', folderId: folder.id }))
    const unfiled = await mailRepository.create(mailProps({ subject: 'Unfiled' }))

    const result = await mailRepository.findByFolder(folder.id)

    assert.isTrue(result.some((mail) => mail.id === filed.id))
    assert.isFalse(result.some((mail) => mail.id === unfiled.id))

    await folder.delete()
  })
})
