import Domain from '#models/domain'
import User from '#models/user'
import DomainRepository from '#repositories/domain_repository'
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

test.group('DomainService / custom login hostname', (group) => {
  const domainName = 'custom-login-hostname-test.shop'
  const userEmail = 'custom-login-hostname.tester@example.com'
  let user: User
  let domain: Domain
  let domainService: DomainService
  let domainRepository: DomainRepository

  group.setup(async () => {
    user = await User.create({
      firstName: 'CustomHostname',
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
    domainService = await app.container.make(DomainService)
    domainRepository = await app.container.make(DomainRepository)
  })

  group.teardown(async () => {
    await domain.delete()
    await User.query().where('email', userEmail).delete()
  })

  test('setCustomLoginHostname rejects a hostname that is not this domain or a subdomain of it', async ({
    assert,
  }) => {
    try {
      await domainService.setCustomLoginHostname(domain.id, 'mail.a-totally-different-domain.shop')
      assert.fail('Expected setCustomLoginHostname to reject an unrelated hostname')
    } catch (error) {
      assert.equal(httpStatus(error), 422)
    }
  })

  test('setCustomLoginHostname accepts a subdomain of this domain and stores it unverified', async ({
    assert,
  }) => {
    const updated = await domainService.setCustomLoginHostname(domain.id, `mail.${domainName}`)
    assert.equal(updated.customLoginHostname, `mail.${domainName}`)
    assert.isFalse(updated.customLoginHostnameVerified)
  })

  test('verifyCustomLoginHostname rejects a domain with no hostname configured', async ({
    assert,
  }) => {
    const bareDomain = await Domain.create({
      name: 'no-hostname-configured-test.shop',
      description: 'Domain created from test',
      verified: false,
      userId: user.id,
    })

    try {
      await domainService.verifyCustomLoginHostname(bareDomain.id)
      assert.fail('Expected verifyCustomLoginHostname to reject an unconfigured domain')
    } catch (error) {
      assert.equal(httpStatus(error), 400)
    }

    await bareDomain.delete()
  })

  test('verifyCustomLoginHostname returns false and stays unverified for a hostname that does not resolve to the expected IP', async ({
    assert,
  }) => {
    await domainService.setCustomLoginHostname(domain.id, `mail.${domainName}`)
    const verified = await domainService.verifyCustomLoginHostname(domain.id)
    assert.isFalse(verified)

    const found = await domainRepository.findById(domain.id)
    assert.isFalse(found!.customLoginHostnameVerified)
  })
})
