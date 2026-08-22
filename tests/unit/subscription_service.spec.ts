import User from '#models/user'
import SubscriptionRepository from '#repositories/subscription_repository'
import { SubscriptionService } from '#services/subscription_service'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

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

  test('getCurrentForUser prefers the latest active subscription over a pending one', async ({
    assert,
  }) => {
    const repository = await app.container.make(SubscriptionRepository)

    await repository.create({
      userId: user.id,
      provider: 'stripe',
      planId: 'core',
      mailboxQuantity: 1,
      billingMonths: 1,
      countryCode: null,
      currency: 'XAF',
      amountTotal: 2500,
      status: 'pending',
      currentPeriodEnd: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      pendingPlanId: null,
      pendingCheckoutPaymentId: null,
    })
    const active = await repository.create({
      userId: user.id,
      provider: 'stripe',
      planId: 'plus',
      mailboxQuantity: 2,
      billingMonths: 1,
      countryCode: null,
      currency: 'XAF',
      amountTotal: 7000,
      status: 'active',
      currentPeriodEnd: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      pendingPlanId: null,
      pendingCheckoutPaymentId: null,
    })

    const current = await subscriptionService.getCurrentForUser()
    assert.equal(current!.id, active.id)
  })

  test('getCurrentForUser falls back to the latest subscription when none are active', async ({
    assert,
  }) => {
    const otherUser = await User.create({
      firstName: 'NoActive',
      lastName: 'Tester',
      email: 'subscription-service.no-active@example.com',
      password: 'password',
    })
    app.container.bind(HttpContext, () => {
      return { ...testUtils.createHttpContext(), auth: { user: otherUser } }
    })
    const otherSubscriptionService = await app.container.make(SubscriptionService)
    const repository = await app.container.make(SubscriptionRepository)

    const pending = await repository.create({
      userId: otherUser.id,
      provider: 'stripe',
      planId: 'core',
      mailboxQuantity: 1,
      billingMonths: 1,
      countryCode: null,
      currency: 'XAF',
      amountTotal: 2500,
      status: 'pending',
      currentPeriodEnd: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      pendingPlanId: null,
      pendingCheckoutPaymentId: null,
    })

    const current = await otherSubscriptionService.getCurrentForUser()
    assert.equal(current!.id, pending.id)

    await otherUser.delete()
  })

  test('getCurrentForUser returns null for a user with no subscriptions at all', async ({
    assert,
  }) => {
    const freshUser = await User.create({
      firstName: 'Fresh',
      lastName: 'Tester',
      email: 'subscription-service.fresh@example.com',
      password: 'password',
    })
    app.container.bind(HttpContext, () => {
      return { ...testUtils.createHttpContext(), auth: { user: freshUser } }
    })
    const freshSubscriptionService = await app.container.make(SubscriptionService)

    const current = await freshSubscriptionService.getCurrentForUser()
    assert.isNull(current)

    await freshUser.delete()
  })

  test('changePlan rejects an upgrade — it must go through initiateUpgrade instead', async ({
    assert,
  }) => {
    const repository = await app.container.make(SubscriptionRepository)
    const subscription = await repository.create({
      userId: user.id,
      provider: 'elgiopay',
      planId: 'core',
      mailboxQuantity: 2,
      billingMonths: 1,
      countryCode: null,
      currency: 'XAF',
      amountTotal: 5000,
      status: 'active',
      currentPeriodEnd: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      pendingPlanId: null,
      pendingCheckoutPaymentId: null,
    })

    try {
      await subscriptionService.changePlan(subscription.id, 'plus', 'password')
      assert.fail('Expected changePlan to reject an upgrade')
    } catch (error) {
      assert.equal(httpStatus(error), 422)
    }
  })

  test('changePlan requires a correct currentPassword to schedule a downgrade', async ({
    assert,
  }) => {
    const repository = await app.container.make(SubscriptionRepository)
    const subscription = await repository.create({
      userId: user.id,
      provider: 'elgiopay',
      planId: 'plus',
      mailboxQuantity: 2,
      billingMonths: 1,
      countryCode: null,
      currency: 'XAF',
      amountTotal: 7000,
      status: 'active',
      currentPeriodEnd: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      pendingPlanId: null,
      pendingCheckoutPaymentId: null,
    })

    try {
      await subscriptionService.changePlan(subscription.id, 'core')
      assert.fail('Expected changePlan to require currentPassword')
    } catch (error) {
      assert.equal(httpStatus(error), 422)
    }

    try {
      await subscriptionService.changePlan(subscription.id, 'core', 'wrong-password')
      assert.fail('Expected changePlan to reject an incorrect password')
    } catch (error) {
      assert.equal(httpStatus(error), 400)
    }

    const unchanged = await repository.findById(subscription.id)
    assert.isNull(unchanged!.pendingPlanId)
  })

  test('changePlan schedules a downgrade that only applies once currentPeriodEnd has passed', async ({
    assert,
  }) => {
    const repository = await app.container.make(SubscriptionRepository)
    const subscription = await repository.create({
      userId: user.id,
      provider: 'elgiopay',
      planId: 'plus',
      mailboxQuantity: 2,
      billingMonths: 1,
      countryCode: null,
      currency: 'XAF',
      amountTotal: 7000,
      status: 'active',
      currentPeriodEnd: DateTime.now().plus({ days: 10 }),
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      pendingPlanId: null,
      pendingCheckoutPaymentId: null,
    })

    const scheduled = await subscriptionService.changePlan(subscription.id, 'core', 'password')
    assert.equal(scheduled.planId, 'plus', 'plan stays put until the period ends')
    assert.equal(scheduled.pendingPlanId, 'core')

    // Not due yet — getCurrentForUser must not apply it early.
    const stillPending = await subscriptionService.getCurrentForUser()
    assert.equal(stillPending!.planId, 'plus')
    assert.equal(stillPending!.pendingPlanId, 'core')

    await repository.update(scheduled, { currentPeriodEnd: DateTime.now().minus({ days: 1 }) })

    const applied = await subscriptionService.getCurrentForUser()
    assert.equal(applied!.planId, 'core')
    assert.isNull(applied!.pendingPlanId)
    assert.notEqual(applied!.amountTotal, 7000)
  })

  test('initiateUpgrade rejects a target plan that is not a higher tier', async ({ assert }) => {
    const repository = await app.container.make(SubscriptionRepository)
    const subscription = await repository.create({
      userId: user.id,
      provider: 'elgiopay',
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
      pendingPlanId: null,
      pendingCheckoutPaymentId: null,
    })

    try {
      await subscriptionService.initiateUpgrade(
        subscription.id,
        'core',
        'mtn_mobile_money',
        '677000000'
      )
      assert.fail('Expected initiateUpgrade to reject a same-or-lower tier target')
    } catch (error) {
      assert.equal(httpStatus(error), 422)
    }
  })

  test('initiateUpgrade charges the full new-plan price and activates it once payment completes', async ({
    assert,
  }) => {
    const repository = await app.container.make(SubscriptionRepository)
    const subscription = await repository.create({
      userId: user.id,
      provider: 'elgiopay',
      planId: 'core',
      mailboxQuantity: 2,
      billingMonths: 1,
      countryCode: null,
      currency: 'XAF',
      amountTotal: 5000,
      status: 'active',
      currentPeriodEnd: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      pendingPlanId: null,
      pendingCheckoutPaymentId: null,
    })

    const result = await subscriptionService.initiateUpgrade(
      subscription.id,
      'plus',
      'mtn_mobile_money',
      '677000000' // Elgiopay sandbox number: immediate success
    )
    assert.equal(result.subscription.pendingPlanId, 'plus')
    assert.isTrue('transactionId' in result.providerPayload)
    // Still on the old plan — payment hasn't been confirmed yet.
    assert.equal(result.subscription.planId, 'core')

    const status = await subscriptionService.getStatus(subscription.id)
    assert.equal(status.planId, 'plus')
    assert.isNull(status.pendingPlanId)
    assert.notEqual(status.amountTotal, 5000)
  }).timeout(15000)

  test('changePlan rejects a subscription owned by another user', async ({ assert }) => {
    const repository = await app.container.make(SubscriptionRepository)
    const subscription = await repository.create({
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
      pendingPlanId: null,
      pendingCheckoutPaymentId: null,
    })

    const otherUser = await User.create({
      firstName: 'Other',
      lastName: 'Tester',
      email: 'subscription-service.change-other@example.com',
      password: 'password',
    })
    app.container.bind(HttpContext, () => {
      return { ...testUtils.createHttpContext(), auth: { user: otherUser } }
    })
    const otherSubscriptionService = await app.container.make(SubscriptionService)

    try {
      await otherSubscriptionService.changePlan(subscription.id, 'plus')
      assert.fail('Expected changePlan to reject a subscription owned by another user')
    } catch (error) {
      assert.equal(httpStatus(error), 403)
    }

    await otherUser.delete()
  })

  test('changePlan rejects a non-active subscription', async ({ assert }) => {
    const repository = await app.container.make(SubscriptionRepository)
    const subscription = await repository.create({
      userId: user.id,
      provider: 'elgiopay',
      planId: 'core',
      mailboxQuantity: 1,
      billingMonths: 1,
      countryCode: null,
      currency: 'XAF',
      amountTotal: 2500,
      status: 'pending',
      currentPeriodEnd: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      pendingPlanId: null,
      pendingCheckoutPaymentId: null,
    })

    try {
      await subscriptionService.changePlan(subscription.id, 'plus')
      assert.fail('Expected changePlan to reject a non-active subscription')
    } catch (error) {
      assert.equal(httpStatus(error), 409)
    }
  })

  test('cancelSubscription marks an active subscription canceled, and reactivateSubscription reverses it', async ({
    assert,
  }) => {
    const repository = await app.container.make(SubscriptionRepository)
    const subscription = await repository.create({
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
      pendingPlanId: null,
      pendingCheckoutPaymentId: null,
    })

    const canceled = await subscriptionService.cancelSubscription(subscription.id)
    assert.equal(canceled.status, 'canceled')

    try {
      await subscriptionService.cancelSubscription(subscription.id)
      assert.fail('Expected cancelSubscription to reject an already-canceled subscription')
    } catch (error) {
      assert.equal(httpStatus(error), 409)
    }

    const reactivated = await subscriptionService.reactivateSubscription(subscription.id)
    assert.equal(reactivated.status, 'active')

    try {
      await subscriptionService.reactivateSubscription(subscription.id)
      assert.fail('Expected reactivateSubscription to reject an already-active subscription')
    } catch (error) {
      assert.equal(httpStatus(error), 409)
    }
  })
})
