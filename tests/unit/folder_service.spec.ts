import MailAccount from '#models/mail_account'
import User from '#models/user'
import MailRepository from '#repositories/mail_repository'
import { FolderService } from '#services/folder_service'
import env from '#start/env'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import jwt from 'jsonwebtoken'
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

test.group('FolderService', (group) => {
  const userEmail = 'folder-service.tester@example.com'
  let user: User
  let mailAccount: MailAccount
  let folderService: FolderService
  let mailRepository: MailRepository

  group.setup(async () => {
    user = await User.create({
      firstName: 'Folder',
      lastName: 'Tester',
      email: userEmail,
      password: 'password',
    })
    mailAccount = await MailAccount.create({
      cuid: 'folder-service-test-account',
      username: 'folder-service-tester',
      password: 'password',
      setuped: true,
      userId: user.id,
    })

    await bindMailAccountContext(mailAccount.id)
    folderService = await app.container.make(FolderService)
    mailRepository = await app.container.make(MailRepository)
  })

  group.teardown(async () => {
    await mailAccount.delete()
    await user.delete()
  })

  test('createFolder creates a folder and rejects a duplicate name', async ({ assert }) => {
    const folder = await folderService.createFolder('Clients')
    assert.equal(folder.name, 'Clients')

    try {
      await folderService.createFolder('Clients')
      assert.fail('Expected createFolder to reject a duplicate name')
    } catch (error) {
      assert.equal(httpStatus(error), 409)
    }
  })

  test('listFolders returns folders for the authenticated mail account', async ({ assert }) => {
    await folderService.createFolder('Invoices')

    const folders = await folderService.listFolders()

    assert.isTrue(folders.some((f) => f.name === 'Invoices'))
  })

  test('renameFolder renames a folder and rejects a name collision', async ({ assert }) => {
    const folder = await folderService.createFolder('Old name')
    await folderService.createFolder('Taken')

    const renamed = await folderService.renameFolder(folder.id, 'New name')
    assert.equal(renamed.name, 'New name')

    try {
      await folderService.renameFolder(folder.id, 'Taken')
      assert.fail('Expected renameFolder to reject a name already in use')
    } catch (error) {
      assert.equal(httpStatus(error), 409)
    }
  })

  test('deleteFolder removes a folder', async ({ assert }) => {
    const folder = await folderService.createFolder('Temp')

    await folderService.deleteFolder(folder.id)

    const folders = await folderService.listFolders()
    assert.isFalse(folders.some((f) => f.id === folder.id))
  })

  test('listMailsInFolder returns mail filed into that folder', async ({ assert }) => {
    const folder = await folderService.createFolder('Receipts')
    const filed = await mailRepository.create({
      mailAccountId: mailAccount.id,
      fromEmail: 'someone@example.com',
      toAddresses: ['folder-service-tester@example.com'],
      ccAddresses: null,
      bccAddresses: null,
      replyTo: null,
      subject: 'A receipt',
      bodyHtml: null,
      bodyText: null,
      status: 'received',
      direction: 'received',
      sesMessageId: null,
      attachmentIds: null,
      important: false,
      isSpam: false,
      isRead: true,
      failureReason: null,
      deleted: false,
      folderId: folder.id,
      scheduledAt: null,
    })

    const mails = await folderService.listMailsInFolder(folder.id)

    assert.isTrue(mails.some((m) => m.id === filed.id))
  })

  test('folder access is rejected across mail accounts', async ({ assert }) => {
    const otherUser = await User.create({
      firstName: 'Other',
      lastName: 'Tester',
      email: 'folder-service.other@example.com',
      password: 'password',
    })
    const otherMailAccount = await MailAccount.create({
      cuid: 'folder-service-other-account',
      username: 'folder-service-other',
      password: 'password',
      setuped: true,
      userId: otherUser.id,
    })

    await bindMailAccountContext(otherMailAccount.id)
    const otherFolderService = await app.container.make(FolderService)
    const foreignFolder = await otherFolderService.createFolder('Not yours')

    await bindMailAccountContext(mailAccount.id)
    folderService = await app.container.make(FolderService)

    try {
      await folderService.renameFolder(foreignFolder.id, 'Hijacked')
      assert.fail('Expected renameFolder to reject a folder owned by another mail account')
    } catch (error) {
      assert.equal(httpStatus(error), 404)
    }

    await otherMailAccount.delete()
    await otherUser.delete()
  })
})
