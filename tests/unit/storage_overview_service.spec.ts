import Contact from '#models/contact'
import Domain from '#models/domain'
import File from '#models/file'
import Mail from '#models/mail'
import MailAccount from '#models/mail_account'
import MailAccountProfile from '#models/mail_account_profile'
import Signature from '#models/signature'
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
      pendingPlanId: null,
      pendingCheckoutPaymentId: null,
    })

    const usage = await storageOverviewService.getUsageForCurrentUser()
    const mailbox = usage.mailboxes.find((m) => m.mailAccountId === mailAccountId)
    assert.equal(mailbox!.quotaBytes, defaultStorageBytesForPlan('plus'))

    await subscription.delete()
  })

  test('assertWithinQuota throws once usage plus the additional bytes would exceed the quota', async ({
    assert,
  }) => {
    const mailAccount = await MailAccount.findOrFail(mailAccountId)
    await mailAccount.merge({ storageQuotaBytes: 3500 }).save()

    await storageOverviewService.assertWithinQuota(mailAccountId, 400)

    try {
      await storageOverviewService.assertWithinQuota(mailAccountId, 600)
      assert.fail('Expected assertWithinQuota to reject once the quota would be exceeded')
    } catch (error) {
      assert.equal(httpStatus(error), 413)
    }
  })

  // Regression test: assertWithinQuota is called from StorageService during
  // mail-account-JWT-authenticated upload-link creation, which never
  // populates ctx.auth.user (that guard is only for owner-session requests).
  // It must resolve the default quota via the mail account's owner, not
  // ctx.auth.user, or every upload for a mailbox with no explicit quota
  // crashes.
  test('assertWithinQuota works with no ctx.auth.user bound, as in a mail-account-JWT request', async ({
    assert,
  }) => {
    app.container.bind(HttpContext, () => testUtils.createHttpContext())
    const unauthedStorageOverviewService = await app.container.make(StorageOverviewService)

    const freshMailAccount = await mailAccountService.setupEmailAddress({
      data: [{ username: 'jwt-context-owner', owner: userEmail }],
      domainId: domain.id,
    })

    await unauthedStorageOverviewService.assertWithinQuota(freshMailAccount[0].id, 400)
    assert.isTrue(true, 'assertWithinQuota resolved without ctx.auth.user')

    await bindUserContext(user)
  })

  // Regression: usage previously only summed the `files` table (S3
  // attachments/avatars), ignoring everything a mailbox stores only in
  // Postgres — email bodies, profile fields, signature, contacts. A mailbox
  // with zero files but a large inbox reported 0 bytes used.
  test('getUsageForCurrentUser counts email bodies, profile, signature, and contacts — not just S3 files', async ({
    assert,
  }) => {
    const created = await mailAccountService.setupEmailAddress({
      data: [{ username: 'content-usage-owner', owner: userEmail }],
      domainId: domain.id,
    })
    const contentMailAccountId = created[0].id

    await Mail.create({
      mailAccountId: contentMailAccountId,
      fromEmail: 'sender@example.com',
      toAddresses: ['content-usage-owner@storage-overview-test.shop'],
      ccAddresses: null,
      bccAddresses: null,
      replyTo: null,
      subject: 'a'.repeat(10),
      bodyHtml: 'b'.repeat(500),
      bodyText: 'c'.repeat(200),
      status: 'received',
      direction: 'received',
      sesMessageId: null,
      attachmentIds: null,
      important: false,
      isSpam: false,
      isRead: false,
      failureReason: null,
      deleted: false,
      folderId: null,
      scheduledAt: null,
    })

    await MailAccountProfile.create({
      mailAccountId: contentMailAccountId,
      firstName: 'Content',
      lastName: 'Owner',
      avatar: null,
    })

    await Signature.create({
      mailAccountId: contentMailAccountId,
      name: 'Content Owner',
      jobTitle: 'd'.repeat(20),
      phone: null,
      address: null,
      website: null,
      linkedin: null,
      instagram: null,
      facebook: null,
      includeInNewEmails: true,
      includeInReplies: true,
      includePhoto: false,
    })

    await Contact.create({
      mailAccountId: contentMailAccountId,
      firstName: 'A',
      lastName: 'Contact',
      email: 'a-contact@example.com',
      phone: null,
      company: null,
      notes: 'e'.repeat(50),
    })

    const usage = await storageOverviewService.getUsageForCurrentUser()
    const mailbox = usage.mailboxes.find((m) => m.mailAccountId === contentMailAccountId)

    assert.isDefined(mailbox)
    // No files were ever uploaded for this mailbox — the old, files-only
    // calculation would have reported 0 here.
    assert.isAbove(mailbox!.usedBytes, 0)

    await Mail.query().where('mail_account_id', contentMailAccountId).delete()
    await MailAccountProfile.query().where('mail_account_id', contentMailAccountId).delete()
    await Signature.query().where('mail_account_id', contentMailAccountId).delete()
    await Contact.query().where('mail_account_id', contentMailAccountId).delete()
  })
})
