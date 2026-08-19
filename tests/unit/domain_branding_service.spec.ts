import Domain from '#models/domain'
import User from '#models/user'
import { DomainBrandingService } from '#services/domain_branding_service'
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

test.group('DomainBrandingService', (group) => {
  const domainName = 'domain-branding-test.shop'
  const userEmail = 'domain-branding.tester@example.com'
  let user: User
  let domain: Domain
  let domainBrandingService: DomainBrandingService

  group.setup(async () => {
    user = await User.create({
      firstName: 'Branding',
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
    domainBrandingService = await app.container.make(DomainBrandingService)
  })

  group.teardown(async () => {
    await domain.delete()
    await User.query().where('email', userEmail).delete()
  })

  test('getBranding returns null when nothing has been saved yet', async ({ assert }) => {
    const branding = await domainBrandingService.getBranding(domain.id)
    assert.isNull(branding)
  })

  test('upsertBranding creates branding on first call and updates it on the next', async ({
    assert,
  }) => {
    const created = await domainBrandingService.upsertBranding(domain.id, {
      companyName: 'Acme Inc',
      welcomeMessage: 'Welcome aboard',
      accentColor: '#ff0000',
    })
    assert.equal(created.companyName, 'Acme Inc')

    const updated = await domainBrandingService.upsertBranding(domain.id, {
      companyName: 'Acme Corp',
    })
    assert.equal(updated.companyName, 'Acme Corp')
    assert.equal(updated.welcomeMessage, 'Welcome aboard')

    const fetched = await domainBrandingService.getBranding(domain.id)
    assert.equal(fetched!.companyName, 'Acme Corp')
  })

  test('upsertBranding rejects a domain owned by another user', async ({ assert }) => {
    const otherUser = await User.create({
      firstName: 'Other',
      lastName: 'Tester',
      email: 'domain-branding.other@example.com',
      password: 'password',
    })
    await bindUserContext(otherUser)
    const otherDomainBrandingService = await app.container.make(DomainBrandingService)

    try {
      await otherDomainBrandingService.upsertBranding(domain.id, { companyName: 'Nope' })
      assert.fail('Expected upsertBranding to reject a domain owned by another user')
    } catch (error) {
      assert.equal(httpStatus(error), 403)
    }

    await bindUserContext(user)
    await otherUser.delete()
  })

  test('upsertBranding rejects an unknown logoFileId', async ({ assert }) => {
    try {
      await domainBrandingService.upsertBranding(domain.id, { logoFileId: 999999999 })
      assert.fail('Expected upsertBranding to reject an unknown logoFileId')
    } catch (error) {
      assert.equal(httpStatus(error), 404)
    }
  })

  test('getPublicBranding returns null fields for a domain with no branding saved', async ({
    assert,
  }) => {
    const otherDomain = await Domain.create({
      name: 'domain-branding-public-test.shop',
      description: 'Domain created from test',
      verified: false,
      userId: user.id,
    })

    const publicBranding = await domainBrandingService.getPublicBranding(otherDomain.name)
    assert.isNull(publicBranding.companyName)
    assert.isNull(publicBranding.logoUrl)

    await otherDomain.delete()
  })

  test('getPublicBranding rejects an unknown domain name', async ({ assert }) => {
    try {
      await domainBrandingService.getPublicBranding('does-not-exist-anywhere.shop')
      assert.fail('Expected getPublicBranding to reject an unknown domain')
    } catch (error) {
      assert.equal(httpStatus(error), 404)
    }
  })
})
