import type Domain from '#models/domain'
import User from '#models/user'
import { DomainService } from '#services/domain_service'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
test.group('DomainService', (group) => {
  let domainService: DomainService
  const domainName = 'geek-wear.shop'
  const userEmail = 'domain.tester@example.com'
  let domain: Domain
  group.setup(async () => {
    const user = await User.create({
      firstName: 'Domain',
      lastName: 'Tester',
      email: userEmail,
      password: 'password',
    })
    app.container.bind(HttpContext, () => {
      return { ...testUtils.createHttpContext(), auth: { user: user } }
    })
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
})
