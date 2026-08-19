import Domain from '#models/domain'
import User from '#models/user'
import PaymentRepository from '#repositories/payment_repository'
import SubscriptionRepository from '#repositories/subscription_repository'
import { MailAccountService } from '#services/mail_account_service'
import { StorageOverviewService } from '#services/storage_overview_service'
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

test.group('StorageOverviewService / storage add-on checkout', (group) => {
  const domainName = 'storage-addon-test.shop'
  const userEmail = 'storage-addon.tester@example.com'
  let user: User
  let domain: Domain
  let mailAccountService: MailAccountService
  let storageOverviewService: StorageOverviewService
  let mailAccountId: number

  group.setup(async () => {
    user = await User.create({
      firstName: 'StorageAddon',
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
    storageOverviewService = await app.container.make(StorageOverviewService)

    const created = await mailAccountService.setupEmailAddress({
      data: [{ username: 'addon-owner', owner: userEmail }],
      domainId: domain.id,
    })
    mailAccountId = created[0].id
  })

  group.teardown(async () => {
    await domain.delete()
    await User.query().where('email', userEmail).delete()
  })

  test('createStorageAddonCheckout rejects extraGB of zero or less', async ({ assert }) => {
    try {
      await storageOverviewService.createStorageAddonCheckout(
        { mailAccountId, extraGB: 0, paymentMethod: 'card' },
        '41.202.219.1'
      )
      assert.fail('Expected createStorageAddonCheckout to reject a non-positive extraGB')
    } catch (error) {
      assert.equal(httpStatus(error), 422)
    }
  })

  test('createStorageAddonCheckout rejects an unknown mail account', async ({ assert }) => {
    try {
      await storageOverviewService.createStorageAddonCheckout(
        { mailAccountId: 999999999, extraGB: 5, paymentMethod: 'card' },
        '41.202.219.1'
      )
      assert.fail('Expected createStorageAddonCheckout to reject an unknown mail account')
    } catch (error) {
      assert.equal(httpStatus(error), 404)
    }
  })

  test('createStorageAddonCheckout rejects a mail account owned by another user', async ({
    assert,
  }) => {
    const otherUser = await User.create({
      firstName: 'Other',
      lastName: 'Tester',
      email: 'storage-addon.other@example.com',
      password: 'password',
    })
    await bindUserContext(otherUser)
    const otherStorageOverviewService = await app.container.make(StorageOverviewService)

    try {
      await otherStorageOverviewService.createStorageAddonCheckout(
        { mailAccountId, extraGB: 5, paymentMethod: 'card' },
        '41.202.219.1'
      )
      assert.fail(
        'Expected createStorageAddonCheckout to reject a mail account owned by another user'
      )
    } catch (error) {
      assert.equal(httpStatus(error), 403)
    }

    await bindUserContext(user)
    await otherUser.delete()
  })

  test('createStorageAddonCheckout rejects a user with no active subscription', async ({
    assert,
  }) => {
    try {
      await storageOverviewService.createStorageAddonCheckout(
        { mailAccountId, extraGB: 5, paymentMethod: 'card' },
        '41.202.219.1'
      )
      assert.fail('Expected createStorageAddonCheckout to reject with no active subscription')
    } catch (error) {
      assert.equal(httpStatus(error), 402)
    }
  })

  test('getStorageAddonPaymentStatus rejects an unknown payment', async ({ assert }) => {
    try {
      await storageOverviewService.getStorageAddonPaymentStatus(999999999)
      assert.fail('Expected getStorageAddonPaymentStatus to reject an unknown payment')
    } catch (error) {
      assert.equal(httpStatus(error), 404)
    }
  })

  test('getStorageAddonPaymentStatus rejects a payment on a subscription owned by another user', async ({
    assert,
  }) => {
    const subscriptionRepository = await app.container.make(SubscriptionRepository)
    const paymentRepository = await app.container.make(PaymentRepository)

    const otherUser = await User.create({
      firstName: 'Other',
      lastName: 'Tester',
      email: 'storage-addon.payment-other@example.com',
      password: 'password',
    })
    const subscription = await subscriptionRepository.create({
      userId: otherUser.id,
      provider: 'elgiopay',
      planId: 'core',
      mailboxQuantity: 1,
      billingMonths: 1,
      countryCode: null,
      currency: 'XAF',
      amountTotal: 2500,
      status: 'active',
      currentPeriodEnd: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    })
    const payment = await paymentRepository.create({
      subscriptionId: subscription.id,
      provider: 'elgiopay',
      providerTransactionId: 'txn-storage-addon-test',
      amount: 750,
      currency: 'XAF',
      status: 'pending',
      customerPhone: '699000000',
      failureReason: null,
      rawResponse: { type: 'storage_addon', mailAccountId, extraGB: 5 },
    })

    try {
      await storageOverviewService.getStorageAddonPaymentStatus(payment.id)
      assert.fail(
        'Expected getStorageAddonPaymentStatus to reject a payment owned by another user'
      )
    } catch (error) {
      assert.equal(httpStatus(error), 403)
    }

    await otherUser.delete()
  })

  test('getStorageAddonPaymentStatus returns immediately for an already-completed payment without contacting the gateway', async ({
    assert,
  }) => {
    const subscriptionRepository = await app.container.make(SubscriptionRepository)
    const paymentRepository = await app.container.make(PaymentRepository)

    const subscription = await subscriptionRepository.create({
      userId: user.id,
      provider: 'elgiopay',
      planId: 'core',
      mailboxQuantity: 1,
      billingMonths: 1,
      countryCode: null,
      currency: 'XAF',
      amountTotal: 2500,
      status: 'active',
      currentPeriodEnd: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    })
    const payment = await paymentRepository.create({
      subscriptionId: subscription.id,
      provider: 'elgiopay',
      providerTransactionId: 'txn-already-completed',
      amount: 750,
      currency: 'XAF',
      status: 'completed',
      customerPhone: '699000000',
      failureReason: null,
      rawResponse: { type: 'storage_addon', mailAccountId, extraGB: 5 },
    })

    const result = await storageOverviewService.getStorageAddonPaymentStatus(payment.id)
    assert.equal(result.status, 'completed')
  })
})
