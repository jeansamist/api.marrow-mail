import Domain from '#models/domain'
import User from '#models/user'
import { MailAccountService } from '#services/mail_account_service'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

function httpStatus(error: unknown): number | undefined {
  return typeof error === 'object' && error !== null && 'status' in error
    ? (error as { status?: number }).status
    : undefined
}

async function bindUserContext(user: User) {
  app.container.bind(HttpContext, () => {
    return { ...testUtils.createHttpContext(), auth: { user } }
  })
}

test.group('MailAccountService', (group) => {
  const userEmail = 'mail-account-service.tester@example.com'
  let user: User
  let domain: Domain
  let mailAccountService: MailAccountService

  group.setup(async () => {
    user = await User.create({
      firstName: 'MailAccount',
      lastName: 'Tester',
      email: userEmail,
      password: 'password',
    })
    domain = await Domain.create({
      name: 'mail-account-service-test.shop',
      description: 'Domain created from test',
      verified: false,
      userId: user.id,
    })
    await bindUserContext(user)
    mailAccountService = await app.container.make(MailAccountService)
  })

  group.teardown(async () => {
    await domain.delete()
    await User.query().where('email', userEmail).delete()
  })

  test('listMailAccountsForCurrentUser only returns the current user mail accounts', async ({
    assert,
  }) => {
    const created = await mailAccountService.setupEmailAddress({
      data: [{ username: 'sales', owner: userEmail }],
      domainId: domain.id,
    })

    const otherUser = await User.create({
      firstName: 'Other',
      lastName: 'Tester',
      email: 'mail-account-service.other@example.com',
      password: 'password',
    })
    const otherDomain = await Domain.create({
      name: 'mail-account-service-other.shop',
      description: 'Other domain',
      verified: false,
      userId: otherUser.id,
    })
    await bindUserContext(otherUser)
    const otherMailAccountService = await app.container.make(MailAccountService)
    await otherMailAccountService.setupEmailAddress({
      data: [{ username: 'support', owner: 'mail-account-service.other@example.com' }],
      domainId: otherDomain.id,
    })

    const otherList = await otherMailAccountService.listMailAccountsForCurrentUser()
    assert.equal(otherList.length, 1)
    assert.equal(otherList[0].username, 'support')

    await bindUserContext(user)
    mailAccountService = await app.container.make(MailAccountService)
    const myList = await mailAccountService.listMailAccountsForCurrentUser()
    assert.equal(myList.length, 1)
    assert.equal(myList[0].id, created[0].id)

    await otherDomain.delete()
    await otherUser.delete()
  })

  test('deleteMailAccount removes the mail account', async ({ assert }) => {
    const created = await mailAccountService.setupEmailAddress({
      data: [{ username: 'billing', owner: userEmail }],
      domainId: domain.id,
    })

    await mailAccountService.deleteMailAccount(created[0].id)

    const list = await mailAccountService.listMailAccountsForCurrentUser()
    assert.isFalse(list.some((m) => m.id === created[0].id))
  })

  test('deleteMailAccount rejects a mail account owned by another user', async ({ assert }) => {
    const created = await mailAccountService.setupEmailAddress({
      data: [{ username: 'hr', owner: userEmail }],
      domainId: domain.id,
    })

    const otherUser = await User.create({
      firstName: 'Foreign',
      lastName: 'Tester',
      email: 'mail-account-service.foreign@example.com',
      password: 'password',
    })
    await bindUserContext(otherUser)
    const otherMailAccountService = await app.container.make(MailAccountService)

    try {
      await otherMailAccountService.deleteMailAccount(created[0].id)
      assert.fail('Expected deleteMailAccount to reject a mail account owned by another user')
    } catch (error) {
      assert.equal(httpStatus(error), 403)
    }

    await bindUserContext(user)
    mailAccountService = await app.container.make(MailAccountService)
    await otherUser.delete()
  })

  test('deleteMailAccount returns 404 for a non-existent mail account', async ({ assert }) => {
    try {
      await mailAccountService.deleteMailAccount(999999999)
      assert.fail('Expected deleteMailAccount to reject a non-existent mail account')
    } catch (error) {
      assert.equal(httpStatus(error), 404)
    }
  })
})
