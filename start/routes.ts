/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.ts'

router.get('/', () => {
  return { hello: 'marrowmails' }
})

// SES inbound webhook — no auth, public endpoint for AWS SNS
router.post('/api/webhooks/ses', [controllers.SesWebhook, 'handle'])

// Payment webhooks — no auth, public endpoints, signature-verified in-controller
router.post('/api/webhooks/stripe', [controllers.StripeWebhook, 'handle'])
router.post('/api/webhooks/elgiopay', [controllers.ElgiopayWebhook, 'handle'])

// Public domain branding — no auth, used by the team-login page for teammates
// who have never touched the browser that did onboarding.
router.get('/api/domains/:name/public-branding', [controllers.PublicDomains, 'publicBranding'])

// Public custom-login-hostname lookup — no auth, called server-side by the
// frontend's Host-header middleware to resolve a custom hostname to a domain.
router.get('/api/domains/by-hostname/:hostname', [controllers.PublicDomains, 'byHostname'])

// Public voice-note playback — no auth, opened by whoever received the email.
// Looked up by an opaque token, not the numeric file id.
router.get('/api/voice-notes/:token', [controllers.VoiceNotes, 'show'])

router
  .group(() => {
    router
      .group(() => {
        router.post('/sign-up', [controllers.Auth, 'signUp'])
        router.post('/verify-email', [controllers.Auth, 'verifyEmail'])
        router.post('/sign-in', [controllers.Auth, 'signIn'])
        router.post('/forgot-password', [controllers.Auth, 'forgotPassword'])
        router.post('/reset-password', [controllers.Auth, 'resetPassword'])
        router
          .group(() => {
            router.post('/logout', [controllers.Auth, 'logout'])
            router.post('/delete-account', [controllers.Auth, 'deleteAccount'])
            router.get('/profile', [controllers.Auth, 'profile'])
            router.put('/update-profile', [controllers.Auth, 'updateProfile'])
          })
          .use([middleware.auth()])
      })
      .prefix('/auth')
    // Mail account profiles + account-administration routes
    router
      .group(() => {
        router.get('/', [controllers.MailAccounts, 'index'])
        router.delete('/:id', [controllers.MailAccounts, 'destroy'])
        router.get('/:mailAccountId/profile', [controllers.MailAccountProfiles, 'show'])
        router.put('/:id/toggle-active', [controllers.MailAccounts, 'toggleActive'])
        router.post('/:id/resend-invite', [controllers.MailAccounts, 'resendInvite'])
      })
      .prefix('/mail-accounts')
      .use([middleware.auth()])
    // Domains routes (account administration — post-onboarding domain management)
    router
      .group(() => {
        router.get('/', [controllers.Domains, 'index'])
        router.post('/', [controllers.Domains, 'store'])
        router.delete('/:id', [controllers.Domains, 'destroy'])
        router.get('/:id/branding', [controllers.Domains, 'getBranding'])
        router.put('/:id/branding', [controllers.Domains, 'updateBranding'])
        router.post('/:id/branding/logo-upload-link', [controllers.Domains, 'createLogoUploadLink'])
        router.put('/:id/custom-login-hostname', [controllers.Domains, 'setCustomLoginHostname'])
        router.post('/:id/custom-login-hostname/verify', [
          controllers.Domains,
          'verifyCustomLoginHostname',
        ])
      })
      .prefix('/domains')
      .use([middleware.auth()])
    // Storage overview (account administration — aggregate usage across all mailboxes)
    router
      .group(() => {
        router.get('/usage', [controllers.StorageOverview, 'usage'])
        router.post('/addon-checkout', [controllers.StorageOverview, 'createAddonCheckout'])
        router.get('/addon-payments/:paymentId', [
          controllers.StorageOverview,
          'addonPaymentStatus',
        ])
      })
      .prefix('/storage')
      .use([middleware.auth()])
    // Role aliases (account administration — extra accepted usernames on a
    // domain that route to an existing mailbox)
    router
      .group(() => {
        router.get('/domains/:domainId/role-aliases', [controllers.RoleAliases, 'index'])
        router.post('/domains/:domainId/role-aliases', [controllers.RoleAliases, 'store'])
        router.delete('/role-aliases/:id', [controllers.RoleAliases, 'destroy'])
      })
      .use([middleware.auth()])
    // Subscriptions (account administration — current plan for the dashboard/settings UI)
    router
      .group(() => {
        router.get('/current', [controllers.Subscriptions, 'current'])
        router.put('/:id/change-plan', [controllers.Subscriptions, 'changePlan'])
        router.post('/:id/upgrade-checkout', [controllers.Subscriptions, 'upgradeCheckout'])
        router.post('/:id/cancel', [controllers.Subscriptions, 'cancel'])
        router.post('/:id/reactivate', [controllers.Subscriptions, 'reactivate'])
      })
      .prefix('/subscriptions')
      .use([middleware.auth()])
    // Domain purchase (buy a brand-new domain via AWS Route53 Domains)
    router
      .group(() => {
        router.post('/search', [controllers.DomainPurchase, 'search'])
        router.post('/checkout', [controllers.DomainPurchase, 'checkout'])
        router.get('/status/:paymentId', [controllers.DomainPurchase, 'status'])
        router.get('/registration-status/:domainName', [
          controllers.DomainPurchase,
          'registrationStatus',
        ])
      })
      .prefix('/domain-purchase')
      .use([middleware.auth()])
    // Onboarding routes
    router
      .group(() => {
        router.post('/register-domain', [controllers.Onboarding, 'registerDomain'])
        router.post('/setup-mail-account', [controllers.Onboarding, 'setupMailAccount'])
        router.get('/get-dns-records', [controllers.Onboarding, 'getDNSRecords'])
        router.get('/check-domain-status', [controllers.Onboarding, 'checkDomainStatus'])
        router.post('/checkout-subscription', [controllers.Subscriptions, 'checkout'])
        router.get('/subscription-status/:id', [controllers.Subscriptions, 'status'])
      })
      .prefix('/onboarding')
      .use([middleware.auth()])

    // Mail APP routes

    router
      .group(() => {
        router
          .group(() => {
            router.post('/login', [controllers.AuthMailAccounts, 'login'])
            router.post('/verify-2fa', [controllers.AuthMailAccounts, 'verifyTwoFactor'])
            router.post('/forgot-password', [controllers.AuthMailAccounts, 'forgotPassword'])
            router.post('/reset-password', [controllers.AuthMailAccounts, 'resetPassword'])
            router.get('/profile', [controllers.AuthMailAccounts, 'profile'])
            router.put('/change-password', [controllers.AuthMailAccounts, 'changePassword'])
            router
              .group(() => {
                router.post('/setup', [controllers.AuthMailAccounts, 'setupTwoFactor'])
                router.post('/enable', [controllers.AuthMailAccounts, 'enableTwoFactor'])
                router.post('/disable', [controllers.AuthMailAccounts, 'disableTwoFactor'])
              })
              .prefix('/2fa')
          })
          .prefix('/auth')
        router.post('/setup-profile', [controllers.MailAccountProfiles, 'setupMailAccountProfile'])
        router.put('/profile', [controllers.MailAccountProfiles, 'updateProfile'])

        // Forward incoming mail to an external, verified address
        router
          .group(() => {
            router.put('/', [controllers.MailForwarding, 'setForwardingEmail'])
            router.post('/verify', [controllers.MailForwarding, 'verify'])
            router.put('/preferences', [controllers.MailForwarding, 'updatePreferences'])
          })
          .prefix('/forwarding')

        // Storage routes
        router
          .group(() => {
            router.post('/upload-link', [controllers.Storage, 'createUploadLink'])
            router.post('/upload-links', [controllers.Storage, 'createUploadLinks'])
            router.get('/files', [controllers.Storage, 'files'])
            router.delete('/files/*', [controllers.Storage, 'deleteFile'])
          })
          .prefix('/storage')
        router.get('/storage/files/*', [controllers.Storage, 'getFile'])

        // Mails routes (JWT auth via Authorization: Bearer)
        router
          .group(() => {
            router.post('/', [controllers.Mail, 'send'])
            router.get('/', [controllers.Mail, 'index'])
            router.get('/sent', [controllers.Mail, 'sent'])
            router.get('/received', [controllers.Mail, 'received'])
            router.get('/:id/attachments', [controllers.Mail, 'attachments'])
            router.get('/drafts', [controllers.Mail, 'drafts'])
            router.post('/drafts', [controllers.Mail, 'saveDraft'])
            router.put('/drafts/:id', [controllers.Mail, 'updateDraft'])
            router.delete('/drafts/:id', [controllers.Mail, 'deleteDraft'])
            router.post('/drafts/:id/send', [controllers.Mail, 'sendDraft'])
            router.put('/:id/folder', [controllers.Mail, 'moveToFolder'])
            router.put('/:id/spam', [controllers.Mail, 'markSpam'])
            router.put('/:id/star', [controllers.Mail, 'markImportant'])
            router.put('/:id/read', [controllers.Mail, 'markRead'])
            router.post('/:id/forward', [controllers.Mail, 'forward'])
            router.get('/scheduled', [controllers.Mail, 'scheduled'])
            router.post('/schedule', [controllers.Mail, 'scheduleMail'])
            router.put('/:id/schedule', [controllers.Mail, 'reschedule'])
            router.delete('/:id/schedule', [controllers.Mail, 'cancelSchedule'])
            router.get('/trash', [controllers.Mail, 'trashList'])
            router.get('/spam', [controllers.Mail, 'spamList'])
            router.put('/:id/trash', [controllers.Mail, 'trash'])
            router.put('/:id/restore', [controllers.Mail, 'restore'])
            router.delete('/:id', [controllers.Mail, 'destroy'])
          })
          .prefix('/mails')

        // Folders routes
        router
          .group(() => {
            router.get('/', [controllers.Folders, 'index'])
            router.post('/', [controllers.Folders, 'store'])
            router.put('/:id', [controllers.Folders, 'update'])
            router.delete('/:id', [controllers.Folders, 'destroy'])
            router.get('/:id/mails', [controllers.Folders, 'mails'])
          })
          .prefix('/folders')

        // Contacts routes
        router
          .group(() => {
            router.get('/', [controllers.Contacts, 'index'])
            router.post('/', [controllers.Contacts, 'store'])
            router.get('/:id', [controllers.Contacts, 'show'])
            router.put('/:id', [controllers.Contacts, 'update'])
            router.delete('/:id', [controllers.Contacts, 'destroy'])
          })
          .prefix('/contacts')

        // Signature routes
        router
          .group(() => {
            router.get('/', [controllers.Signatures, 'show'])
            router.put('/', [controllers.Signatures, 'update'])
          })
          .prefix('/signature')
      })
      .prefix('/mail')
  })
  .prefix('/api')
