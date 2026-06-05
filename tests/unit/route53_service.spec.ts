import { Route53Service } from '#services/route53_service'
import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

test.group('Route53Service', (group) => {
  let route53Service: Route53Service
  let hostedZone: Awaited<ReturnType<Route53Service['createHostedZone']>>
  const domainName = 'geek-wear.shop'
  group.setup(async () => {
    route53Service = await app.container.make(Route53Service)
  })

  test('create a new hosted zone', async ({ assert }) => {
    hostedZone = await route53Service.createHostedZone(domainName)
    assert.equal(hostedZone.HostedZone?.Name?.replace(/\.$/, ''), domainName)
  })

  test('get a hosted zone', async ({ assert }) => {
    const retrievedHostedZone = await route53Service.getHostedZone(hostedZone.HostedZone!.Id!)
    assert.equal(retrievedHostedZone.HostedZone?.Id, hostedZone.HostedZone?.Id)
  })

  test('delete a hosted zone', async ({ assert }) => {
    await route53Service.deleteHostedZone(hostedZone.HostedZone!.Id!)
    assert.isTrue(true)
  })
})
