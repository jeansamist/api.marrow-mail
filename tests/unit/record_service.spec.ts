import type Domain from '#models/domain'
import type Record from '#models/record'
import User from '#models/user'
import { DomainService } from '#services/domain_service'
import { RecordService } from '#services/record_service'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
test.group('RecordService', (group) => {
  let domainService: DomainService
  let recordService: RecordService
  const domainName = 'geek-wear.shop'
  const userEmail = 'domain.tester@example.com'
  let domain: Domain
  let record: Record
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
    recordService = await app.container.make(RecordService)
    const result = await domainService.createDomain({
      name: domainName,
      description: 'Domain created from test',
      verified: false,
    })
    domain = result
  })
  group.teardown(async () => {
    await User.query().where('email', userEmail).delete()
    await domainService.deleteDomain(domain.id)
  })

  test('create a new record', async ({ assert }) => {
    const result = await recordService.createRecord({
      name: 'www',
      type: 'CNAME',
      value: 'example.com',
      domainId: domain.id,
      priority: null,
    })
    record = result
    assert.equal(result.name, 'www')
  })
  test('find a record', async ({ assert }) => {
    const result = await recordService.findRecordById(record.id)
    assert.isNotNull(result)
  })
  test('update a record', async ({ assert }) => {
    const result = await recordService.updateRecord(record.id, {
      name: 'updated-www',
      type: 'CNAME',
      value: 'updated-example.com',
    })
    assert.equal(result.name, 'updated-www')
  })
  test('delete a record', async ({ assert }) => {
    await recordService.deleteRecord(record.id)
    const existingRecord = await recordService.findRecordById(record.id)
    assert.isNull(existingRecord)
  })
})
