import Domain from '#models/domain'
import User from '#models/user'
import { MailAccountService } from '#services/mail_account_service'
import { RoleAliasService } from '#services/role_alias_service'
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

test.group('RoleAliasService', (group) => {
  const domainName = 'role-alias-test.shop'
  const userEmail = 'role-alias.tester@example.com'
  let user: User
  let domain: Domain
  let mailAccountService: MailAccountService
  let roleAliasService: RoleAliasService
  let mailAccountId: number

  group.setup(async () => {
    user = await User.create({
      firstName: 'RoleAlias',
      lastName: 'Tester',
      email: userEmail,
      password: 'password',
    })
    domain = await Domain.create({
      name: domainName,
      description: 'Domain created from test',
      verified: false,
      userId: user.id,
    })
    await bindUserContext(user)
    mailAccountService = await app.container.make(MailAccountService)
    roleAliasService = await app.container.make(RoleAliasService)

    const created = await mailAccountService.setupEmailAddress({
      data: [{ username: 'sales', owner: userEmail }],
      domainId: domain.id,
    })
    mailAccountId = created[0].id
  })

  group.teardown(async () => {
    await domain.delete()
    await User.query().where('email', userEmail).delete()
  })

  test('create adds a role alias routing to an existing mailbox', async ({ assert }) => {
    const created = await roleAliasService.create(domain.id, {
      alias: 'contact',
      mailAccountId,
    })
    assert.equal(created.alias, 'contact')
    assert.equal(created.mailAccountId, mailAccountId)

    const list = await roleAliasService.listForDomain(domain.id)
    assert.isTrue(list.some((r) => r.alias === 'contact'))
  })

  test('create rejects a duplicate alias on the same domain', async ({ assert }) => {
    await roleAliasService.create(domain.id, { alias: 'duplicate-alias', mailAccountId })

    try {
      await roleAliasService.create(domain.id, { alias: 'duplicate-alias', mailAccountId })
      assert.fail('Expected create to reject a duplicate alias')
    } catch (error) {
      assert.equal(httpStatus(error), 409)
    }
  })

  test('create rejects a mail account that does not belong to this domain', async ({
    assert,
  }) => {
    const otherDomain = await Domain.create({
      name: 'role-alias-other-test.shop',
      description: 'Domain created from test',
      verified: false,
      userId: user.id,
    })
    const otherAccount = await mailAccountService.setupEmailAddress({
      data: [{ username: 'billing', owner: userEmail }],
      domainId: otherDomain.id,
    })

    try {
      await roleAliasService.create(domain.id, {
        alias: 'cross-domain',
        mailAccountId: otherAccount[0].id,
      })
      assert.fail('Expected create to reject a mail account from a different domain')
    } catch (error) {
      assert.equal(httpStatus(error), 404)
    }

    await otherDomain.delete()
  })

  test('create rejects a domain owned by another user', async ({ assert }) => {
    const otherUser = await User.create({
      firstName: 'Other',
      lastName: 'Tester',
      email: 'role-alias.other@example.com',
      password: 'password',
    })
    await bindUserContext(otherUser)
    const otherRoleAliasService = await app.container.make(RoleAliasService)

    try {
      await otherRoleAliasService.create(domain.id, { alias: 'nope', mailAccountId })
      assert.fail('Expected create to reject a domain owned by another user')
    } catch (error) {
      assert.equal(httpStatus(error), 403)
    }

    await bindUserContext(user)
    await otherUser.delete()
  })

  test('delete removes the role alias', async ({ assert }) => {
    const created = await roleAliasService.create(domain.id, {
      alias: 'to-delete',
      mailAccountId,
    })
    await roleAliasService.delete(created.id)

    const list = await roleAliasService.listForDomain(domain.id)
    assert.isFalse(list.some((r) => r.id === created.id))
  })

  test('delete returns 404 for a non-existent role alias', async ({ assert }) => {
    try {
      await roleAliasService.delete(999999999)
      assert.fail('Expected delete to reject a non-existent role alias')
    } catch (error) {
      assert.equal(httpStatus(error), 404)
    }
  })
})
