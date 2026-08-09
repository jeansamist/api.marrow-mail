import type Domain from '#models/domain'
import User from '#models/user'
import { DomainService } from '#services/domain_service'
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

test.group('DomainService', (group) => {
  let domainService: DomainService
  const domainName = 'geek-wear.shop'
  const userEmail = 'domain.tester@example.com'
  let domain: Domain
  let user: User
  group.setup(async () => {
    user = await User.create({
      firstName: 'Domain',
      lastName: 'Tester',
      email: userEmail,
      password: 'password',
    })
    await bindUserContext(user)
    domainService = await app.container.make(DomainService)
  })
  group.teardown(async () => {
    await User.query().where('email', userEmail).delete()
  })

  test('create a new domain', async ({ assert }) => {
    const result = await domainService.createDomain({
      name: domainName,
      description: 'Domain created from test',
      verified: false,
    })
    domain = result
    assert.equal(result.name, domainName)
  })
  test('find a domain', async ({ assert }) => {
    const result = await domainService.findDomainById(domain.id)
    assert.isNotNull(result)
  })
  test('update a domain', async ({ assert }) => {
    const result = await domainService.updateDomain(domain.id, {
      name: domainName,
      description: 'Domain created from test',
      verified: false,
    })
    assert.equal(result.name, domainName)
  })
  test('change a domain to verified', async ({ assert }) => {
    const result = await domainService.changeDomainToVerify(domain.id)
    domain = result
    assert.isTrue(result.verified)
  })
  test('delete a domain', async ({ assert }) => {
    await domainService.deleteDomain(domain.id)
    const existingDomain = await domainService.findDomainById(domain.id)
    assert.isNull(existingDomain)
  })

  test('setupDomain is idempotent for the same owner', async ({ assert }) => {
    const setupDomainName = 'idempotent-test-domain.shop'
    const firstRecords = await domainService.setupDomain({ name: setupDomainName })
    assert.isTrue(firstRecords.length > 0)

    const secondRecords = await domainService.setupDomain({ name: setupDomainName })
    assert.deepEqual(secondRecords.map((r) => r.id).sort(), firstRecords.map((r) => r.id).sort())

    const registeredDomain = await domainService.findDomainByName(setupDomainName)
    if (registeredDomain) await domainService.deleteDomain(registeredDomain.id)
  }).timeout(30000)

  test('setupDomain rejects a domain already registered by another user', async ({ assert }) => {
    const setupDomainName = 'idempotent-test-domain-2.shop'
    await domainService.setupDomain({ name: setupDomainName })

    const otherUser = await User.create({
      firstName: 'Other',
      lastName: 'Tester',
      email: 'domain.tester.other@example.com',
      password: 'password',
    })
    await bindUserContext(otherUser)
    const otherDomainService = await app.container.make(DomainService)

    try {
      await otherDomainService.setupDomain({ name: setupDomainName })
      assert.fail('Expected setupDomain to reject a domain owned by another user')
    } catch (error) {
      assert.equal(httpStatus(error), 409)
    }

    await bindUserContext(user)
    domainService = await app.container.make(DomainService)
    const registeredDomain = await domainService.findDomainByName(setupDomainName)
    if (registeredDomain) await domainService.deleteDomain(registeredDomain.id)
    await otherUser.delete()
  }).timeout(30000)
})
