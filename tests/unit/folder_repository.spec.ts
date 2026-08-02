import MailAccount from '#models/mail_account'
import User from '#models/user'
import FolderRepository from '#repositories/folder_repository'
import { test } from '@japa/runner'

test.group('FolderRepository', (group) => {
  const folderRepository = new FolderRepository()
  const userEmail = 'folder-repo.tester@example.com'
  let user: User
  let mailAccount: MailAccount

  group.setup(async () => {
    user = await User.create({
      firstName: 'Folder',
      lastName: 'Tester',
      email: userEmail,
      password: 'password',
    })
    mailAccount = await MailAccount.create({
      cuid: 'folder-repo-test-account',
      username: 'folder-repo-tester',
      password: 'password',
      setuped: true,
      userId: user.id,
    })
  })

  group.teardown(async () => {
    await mailAccount.delete()
    await user.delete()
  })

  test('creates a folder scoped to a mail account', async ({ assert }) => {
    const folder = await folderRepository.create({ name: 'Clients', mailAccountId: mailAccount.id })

    assert.equal(folder.name, 'Clients')
    assert.equal(folder.mailAccountId, mailAccount.id)
  })

  test('findByMailAccountAndName finds an existing folder by name', async ({ assert }) => {
    await folderRepository.create({ name: 'Invoices', mailAccountId: mailAccount.id })

    const found = await folderRepository.findByMailAccountAndName(mailAccount.id, 'Invoices')
    const missing = await folderRepository.findByMailAccountAndName(mailAccount.id, 'Nope')

    assert.isNotNull(found)
    assert.isNull(missing)
  })

  test('findByMailAccount lists all folders for that mail account, ordered by name', async ({
    assert,
  }) => {
    await folderRepository.create({ name: 'Zebra', mailAccountId: mailAccount.id })
    await folderRepository.create({ name: 'Alpha', mailAccountId: mailAccount.id })

    const folders = await folderRepository.findByMailAccount(mailAccount.id)
    const names = folders.map((folder) => folder.name)

    assert.deepEqual(names, [...names].sort())
  })

  test('update renames a folder', async ({ assert }) => {
    const folder = await folderRepository.create({
      name: 'Old name',
      mailAccountId: mailAccount.id,
    })

    const updated = await folderRepository.update(folder, { name: 'New name' })

    assert.equal(updated.name, 'New name')
  })

  test('delete removes a folder', async ({ assert }) => {
    const folder = await folderRepository.create({ name: 'Temp', mailAccountId: mailAccount.id })

    await folderRepository.delete(folder)

    const found = await folderRepository.findById(folder.id)
    assert.isNull(found)
  })
})
