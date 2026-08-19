import Domain from '#models/domain'
import File from '#models/file'
import User from '#models/user'
import SubscriptionRepository from '#repositories/subscription_repository'
import { MailAccountService } from '#services/mail_account_service'
import { StorageOverviewService } from '#services/storage_overview_service'
import { defaultStorageBytesForPlan } from '#utils/pricing'
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

test.group('StorageOverviewService', (group) => {
  const userEmail = 'storage-overview.tester@example.com'
  let user: User
  let domain: Domain
  let mailAccountService: MailAccountService
  let storageOverviewService: StorageOverviewService
  let mailAccountId: number

  group.setup(async () => {
    user = await User.create({
      firstName: 'Storage',
      lastName: 'Tester',
      email: userEmail,
      password: 'password',
    })
    domain = await Domain.create({
      name: 'storage-overview-test.shop',
      description: 'Domain created from test',
      verified: false,
      userId: user.id,
    })
    await bindUserContext(user)
    mailAccountService = await app.container.make(MailAccountService)
    storageOverviewService = await app.container.make(StorageOverviewService)

    const created = await mailAccountService.setupEmailAddress({
      data: [{ username: 'storage-owner', owner: userEmail }],
      domainId: domain.id,
    })
    mailAccountId = created[0].id

    await File.create({
      key: `mail-accounts/${mailAccountId}/one.txt`,
      bucket: 'test-bucket',
      originalName: 'one.txt',
      mimeType: 'text/plain',
      size: 1000,
      mailAccountId,
    })
    await File.create({
      key: `mail-accounts/${mailAccountId}/two.txt`,
      bucket: 'test-bucket',
      originalName: 'two.txt',
      mimeType: 'text/plain',
      size: 2000,
      mailAccountId,
    })
  })

  group.teardown(async () => {
    await File.query().where('mail_account_id', mailAccountId).delete()
    await domain.delete()
    await User.query().where('email', userEmail).delete()
  })

  test('getUsageForCurrentUser sums file sizes per mailbox and falls back to the core-plan default quota with no subscription', async ({
    assert,
  }) => {
    const usage = await storageOverviewService.getUsageForCurrentUser()
    const mailbox = usage.mailboxes.find((m) => m.mailAccountId === mailAccountId)

    assert.isDefined(mailbox)
    assert.equal(mailbox!.usedBytes, 3000)
    assert.equal(mailbox!.quotaBytes, defaultStorageBytesForPlan('core'))
    assert.equal(usage.totalUsedBytes, 3000)
  })

  test('getUsageForCurrentUser falls back to the plus-plan default quota when the user has an active plus subscription', async ({
    assert,
  }) => {
    const subscriptionRepository = await app.container.make(SubscriptionRepository)
    const subscription = await subscriptionRepository.create({
      userId: user.id,
      provider: 'stripe',
      planId: 'plus',
      mailboxQuantity: 1,
      billingMonths: 1,
      countryCode: null,
      currency: 'XAF',
      amountTotal: 3500,
      status: 'active',
      currentPeriodEnd: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    })

    const usage = await storageOverviewService.getUsageForCurrentUser()
    const mailbox = usage.mailboxes.find((m) => m.mailAccountId === mailAccountId)
    assert.equal(mailbox!.quotaBytes, defaultStorageBytesForPlan('plus'))

    await subscription.delete()
  })

  test('updateQuota rejects a mail account owned by another user', async ({ assert }) => {
    const otherUser = await User.create({
      firstName: 'Other',
      lastName: 'Tester',
      email: 'storage-overview.other@example.com',
      password: 'password',
    })
    await bindUserContext(otherUser)
    const otherStorageOverviewService = await app.container.make(StorageOverviewService)

    try {
      await otherStorageOverviewService.updateQuota(mailAccountId, 1000)
      assert.fail('Expected updateQuota to reject a mail account owned by another user')
    } catch (error) {
      assert.equal(httpStatus(error), 403)
    }

    await bindUserContext(user)
    await otherUser.delete()
  })

  test('updateQuota changes the stored quota and getUsageForCurrentUser reflects it', async ({
    assert,
  }) => {
    await storageOverviewService.updateQuota(mailAccountId, 5000)
    const usage = await storageOverviewService.getUsageForCurrentUser()
    const mailbox = usage.mailboxes.find((m) => m.mailAccountId === mailAccountId)
    assert.equal(mailbox!.quotaBytes, 5000)
  })

  test('assertWithinQuota throws once usage plus the additional bytes would exceed the quota', async ({
    assert,
  }) => {
    await storageOverviewService.updateQuota(mailAccountId, 3500)

    await storageOverviewService.assertWithinQuota(mailAccountId, 400)

    try {
      await storageOverviewService.assertWithinQuota(mailAccountId, 600)
      assert.fail('Expected assertWithinQuota to reject once the quota would be exceeded')
    } catch (error) {
      assert.equal(httpStatus(error), 413)
    }
  })
})
