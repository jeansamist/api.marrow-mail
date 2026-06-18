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
            router.post('/login', [controllers.AuthMailAccounts, 'login'])
            router.post('/forgot-password', [controllers.AuthMailAccounts, 'forgotPassword'])
            router.post('/reset-password', [controllers.AuthMailAccounts, 'resetPassword'])
            router.get('/profile', [controllers.AuthMailAccounts, 'profile'])
          })
          .prefix('/auth')
        router.post('/setup-profile', [controllers.MailAccountProfiles, 'setupMailAccountProfile'])

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
          })
          .prefix('/mails')
      })
      .prefix('/mail')
  })
  .prefix('/api')
