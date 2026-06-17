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
  return { hello: 'world' }
})

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
    // Mail account profiles routes
    router
      .group(() => {
        router.get('/:mailAccountId/profile', [controllers.MailAccountProfiles, 'show'])
      })
      .prefix('/mail-accounts')
      .use([middleware.auth()])
    // Onboarding routes
    router
      .group(() => {
        router.post('/register-domain', [controllers.Onboarding, 'registerDomain'])
        router.post('/setup-mail-account', [controllers.Onboarding, 'setupMailAccount'])
        router.get('/get-dns-records', [controllers.Onboarding, 'getDNSRecords'])
        router.get('/check-domain-status', [controllers.Onboarding, 'checkDomainStatus'])
      })
      .prefix('/onboarding')
      .use([middleware.auth()])

    // Mail APP routes

    router
      .group(() => {
        router
          .group(() => {
            // router.post('/login', [controllers.Onboarding, 'registerDomain'])
            // router.get('/profile', [controllers.Onboarding, 'registerDomain'])
            // router.put('/update-profile', [controllers.Auth, 'updateProfile'])
            // router.post('/logout', [controllers.Auth, 'logout'])
            // router.post('/forgot-password', [controllers.Auth, 'forgotPassword'])
            // router.post('/reset-password', [controllers.Auth, 'resetPassword'])
          })
          .prefix('/auth')
        router.post('/setup-profile', [controllers.MailAccountProfiles, 'setupMailAccountProfile'])
      })
      .prefix('/mail')
  })
  .prefix('/api')
