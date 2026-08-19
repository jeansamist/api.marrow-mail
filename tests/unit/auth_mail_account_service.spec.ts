import Domain from '#models/domain'
import User from '#models/user'
import { AuthMailAccountService } from '#services/auth_mail_account_service'
import { MailAccountService } from '#services/mail_account_service'
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

test.group('AuthMailAccountService', (group) => {
  const userEmail = 'auth-mail-account-service.tester@example.com'
  const password = 'a-strong-password'
  let user: User
  let domain: Domain
  let mailAccountService: MailAccountService
  let authMailAccountService: AuthMailAccountService
  let email: string
  let mailAccountId: number

  group.setup(async () => {
    user = await User.create({
      firstName: 'AuthMailAccount',
      lastName: 'Tester',
      email: userEmail,
      password: 'password',
    })
    domain = await Domain.create({
      name: 'auth-mail-account-service-test.shop',
      description: 'Domain created from test',
      verified: false,
      userId: user.id,
    })
    await bindUserContext(user)
    mailAccountService = await app.container.make(MailAccountService)
    authMailAccountService = await app.container.make(AuthMailAccountService)

    const mailAccount = await mailAccountService.createMailAccount({
      username: 'disable-login',
      password,
      ownerEmail: userEmail,
      domainId: domain.id,
    })
    mailAccountId = mailAccount.id
    email = `${mailAccount.username}@${domain.name}`
  })

  group.teardown(async () => {
    await domain.delete()
    await User.query().where('email', userEmail).delete()
  })

  test('login succeeds while the mail account is active', async ({ assert }) => {
    const mailAccount = await authMailAccountService.login({ email, password })
    assert.equal(mailAccount.id, mailAccountId)
  })

  test('login rejects a disabled mail account', async ({ assert }) => {
    await mailAccountService.toggleActive(mailAccountId)

    try {
      await authMailAccountService.login({ email, password })
      assert.fail('Expected login to reject a disabled mail account')
    } catch (error) {
      assert.equal(httpStatus(error), 403)
    }

    await mailAccountService.toggleActive(mailAccountId)
  })

  test('getRequestMailAccount rejects a disabled mail account', async ({ assert }) => {
    const { token } = await authMailAccountService.generateJWT(
      (await mailAccountService.findById(mailAccountId))!
    )
    app.container.bind(HttpContext, () => {
      return {
        ...testUtils.createHttpContext(),
        auth: { user },
        request: { header: (name: string) => (name === 'authorization' ? `Bearer ${token}` : undefined) },
      }
    })
    const scopedAuthMailAccountService = await app.container.make(AuthMailAccountService)

    await mailAccountService.toggleActive(mailAccountId)

    try {
      await scopedAuthMailAccountService.getRequestMailAccount()
      assert.fail('Expected getRequestMailAccount to reject a disabled mail account')
    } catch (error) {
      assert.equal(httpStatus(error), 403)
    }

    await mailAccountService.toggleActive(mailAccountId)
    await bindUserContext(user)
  })
})
