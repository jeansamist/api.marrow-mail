import User from '#models/user'
import { SubscriptionService } from '#services/subscription_service'
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

test.group('SubscriptionService', (group) => {
  const userEmail = 'subscription-service.tester@example.com'
  let user: User
  let subscriptionService: SubscriptionService

  group.setup(async () => {
    user = await User.create({
      firstName: 'Subscription',
      lastName: 'Tester',
      email: userEmail,
      password: 'password',
    })
    await bindUserContext(user)
    subscriptionService = await app.container.make(SubscriptionService)
  })

  group.teardown(async () => {
    await User.query().where('email', userEmail).delete()
  })

  test('checkout rejects mobile money without a customerPhone', async ({ assert }) => {
    try {
      await subscriptionService.checkout(
        {
          planId: 'core',
          mailboxQuantity: 1,
          billingMonths: 1,
          paymentMethod: 'mtn_mobile_money',
        },
        '127.0.0.1'
      )
      assert.fail('Expected checkout to reject missing customerPhone')
    } catch (error) {
      assert.equal(httpStatus(error), 422)
    }
  })

  test('checkout with Elgiopay creates a pending subscription and payment', async ({ assert }) => {
    // Sandbox test number documented by Elgiopay: immediate success.
    const result = await subscriptionService.checkout(
      {
        planId: 'core',
        mailboxQuantity: 2,
        billingMonths: 1,
        paymentMethod: 'mtn_mobile_money',
        customerPhone: '677000000',
      },
      '41.202.219.1' // a Cameroon IP range, for country->currency resolution
    )

    assert.equal(result.subscription.provider, 'elgiopay')
    assert.equal(result.subscription.status, 'pending')
    assert.equal(result.subscription.mailboxQuantity, 2)
    assert.isTrue('transactionId' in result.providerPayload)
  }).timeout(15000)

  test('getStatus reflects an Elgiopay payment that completes immediately', async ({ assert }) => {
    const result = await subscriptionService.checkout(
      {
        planId: 'core',
        mailboxQuantity: 1,
        billingMonths: 1,
        paymentMethod: 'orange_money',
        customerPhone: '699000000',
      },
      '41.202.219.1'
    )

    const status = await subscriptionService.getStatus(result.subscription.id)
    assert.equal(status.status, 'active')
    assert.isNotNull(status.currentPeriodEnd)
  })
    .timeout(15000)
    .retry(2)

  test('getStatus reflects an Elgiopay payment that fails', async ({ assert }) => {
    // Documented sandbox failure number: customer rejected the prompt (error_code 9201).
    const result = await subscriptionService.checkout(
      {
        planId: 'core',
        mailboxQuantity: 1,
        billingMonths: 1,
        paymentMethod: 'orange_money',
        customerPhone: '699000201',
      },
      '41.202.219.1'
    )

    const status = await subscriptionService.getStatus(result.subscription.id)
    assert.equal(status.status, 'failed')
  })
    .timeout(15000)
    .retry(2)

  test('assertActiveEntitlement rejects when the user has no subscription', async ({ assert }) => {
    const otherUser = await User.create({
      firstName: 'NoSub',
      lastName: 'Tester',
      email: 'subscription-service.no-sub@example.com',
      password: 'password',
    })
    await bindUserContext(otherUser)
    const otherSubscriptionService = await app.container.make(SubscriptionService)

    try {
      await otherSubscriptionService.assertActiveEntitlement(1)
      assert.fail('Expected assertActiveEntitlement to reject with no subscription')
    } catch (error) {
      assert.equal(httpStatus(error), 402)
    }

    await otherUser.delete()
    await bindUserContext(user)
    subscriptionService = await app.container.make(SubscriptionService)
  })

  test('assertActiveEntitlement rejects a request exceeding mailboxQuantity', async ({
    assert,
  }) => {
    const result = await subscriptionService.checkout(
      {
        planId: 'core',
        mailboxQuantity: 1,
        billingMonths: 1,
        paymentMethod: 'orange_money',
        customerPhone: '699000000',
      },
      '41.202.219.1'
    )
    await subscriptionService.getStatus(result.subscription.id) // sync to active

    try {
      await subscriptionService.assertActiveEntitlement(2)
      assert.fail('Expected assertActiveEntitlement to reject an over-quantity request')
    } catch (error) {
      assert.equal(httpStatus(error), 402)
    }

    await subscriptionService.assertActiveEntitlement(1)
  })
    .timeout(15000)
    .retry(2)

  test('getStatus is rejected for a subscription owned by another user', async ({ assert }) => {
    const result = await subscriptionService.checkout(
      {
        planId: 'core',
        mailboxQuantity: 1,
        billingMonths: 1,
        paymentMethod: 'orange_money',
        customerPhone: '699000000',
      },
      '41.202.219.1'
    )

    const otherUser = await User.create({
      firstName: 'Foreign',
      lastName: 'Tester',
      email: 'subscription-service.foreign@example.com',
      password: 'password',
    })
    await bindUserContext(otherUser)
    const otherSubscriptionService = await app.container.make(SubscriptionService)

    try {
      await otherSubscriptionService.getStatus(result.subscription.id)
      assert.fail('Expected getStatus to reject access from another user')
    } catch (error) {
      assert.equal(httpStatus(error), 403)
    }

    await otherUser.delete()
    await bindUserContext(user)
    subscriptionService = await app.container.make(SubscriptionService)
  }).timeout(15000)

  test('checkout with card creates a pending Stripe subscription with a client secret', async ({
    assert,
  }) => {
    const result = await subscriptionService.checkout(
      {
        planId: 'plus',
        mailboxQuantity: 3,
        billingMonths: 3,
        paymentMethod: 'card',
      },
      '8.8.8.8'
    )

    assert.equal(result.subscription.provider, 'stripe')
    assert.equal(result.subscription.status, 'pending')
    assert.isTrue('clientSecret' in result.providerPayload)
  }).timeout(20000)

  test('assertActiveEntitlement sums mailboxQuantity across multiple active subscriptions', async ({
    assert,
  }) => {
    const first = await subscriptionService.checkout(
      {
        planId: 'core',
        mailboxQuantity: 1,
        billingMonths: 1,
        paymentMethod: 'orange_money',
        customerPhone: '699000000',
      },
      '41.202.219.1'
    )
    await subscriptionService.getStatus(first.subscription.id) // sync to active

    const second = await subscriptionService.checkout(
      {
        planId: 'core',
        mailboxQuantity: 1,
        billingMonths: 1,
        paymentMethod: 'orange_money',
        customerPhone: '699000000',
      },
      '41.202.219.1'
    )
    await subscriptionService.getStatus(second.subscription.id) // sync to active

    // Two separate active subscriptions, quantity 1 each, should together entitle 2 mailboxes.
    await subscriptionService.assertActiveEntitlement(2)

    try {
      await subscriptionService.assertActiveEntitlement(3)
      assert.fail(
        'Expected assertActiveEntitlement to reject a request exceeding the combined total'
      )
    } catch (error) {
      assert.equal(httpStatus(error), 402)
    }
  })
    .timeout(20000)
    .retry(2)
})
