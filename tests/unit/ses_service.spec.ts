import { SESService } from '#services/ses_service'
import { wait } from '#utils/wait'
import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

test.group('SESService', (group) => {
  let sesService: SESService
  const domainName = 'geek-wear.shop' // Use a test domain you control
  const AWS_TIMEOUT = 15_000
  const VERIFIED_EMAIL = 'jeansamist@gmail.com'

  group.setup(async () => {
    sesService = await app.container.make(SESService)
  })

  test('create a new email identity', async ({ assert }) => {
    const emailIdentity = await sesService.createEmailIdentity(domainName)

    assert.equal(emailIdentity.IdentityType, 'DOMAIN')
    assert.isArray(emailIdentity.DkimAttributes?.Tokens)
    assert.lengthOf(emailIdentity.DkimAttributes!.Tokens!, 3) // SES always issues 3 CNAME tokens
  }).timeout(AWS_TIMEOUT)

  test('get an email identity', async ({ assert }) => {
    const emailIdentity = await sesService.getEmailIdentity(domainName)

    assert.equal(emailIdentity.IdentityType, 'DOMAIN')
  }).timeout(AWS_TIMEOUT)

  test('set mail-from attributes', async ({ assert }) => {
    const response = await sesService.putEmailIdentityMailFromAttributes(domainName)

    // A 200-level response from SES returns an empty object — no error means success
    assert.exists(response.$metadata.httpStatusCode)
    assert.equal(response.$metadata.httpStatusCode, 200)
  }).timeout(AWS_TIMEOUT)

  test('get DKIM records returns 3 CNAME entries in the correct shape', async ({ assert }) => {
    const records = await sesService.getDKIMRecordsForEmailIdentity(domainName)

    assert.lengthOf(records, 3)

    for (const record of records) {
      assert.equal(record.Type, 'CNAME')
      // Name must follow the pattern <token>._domainkey.<domain>
      assert.match(record.Name, new RegExp(`^.+\\._domainkey\\.${domainName}$`))
      // Value must follow the pattern <token>.dkim.amazonses.com
      assert.match(record.Value, /^.+\.dkim\.amazonses\.com$/)
    }
  }).timeout(AWS_TIMEOUT)

  test('getMailFromDNS returns MX and SPF TXT records in the correct shape', ({ assert }) => {
    // Pure in-memory — no AWS call needed
    const records = sesService.getMailFromDNS(domainName)

    assert.lengthOf(records, 2)

    const mx = records.find((r) => r.Type === 'MX')
    const txt = records.find((r) => r.Type === 'TXT')

    assert.exists(mx)
    assert.equal(mx!.Name, `mail.${domainName}`)
    assert.match(mx!.Value, /^feedback-smtp\..+\.amazonses\.com$/)

    assert.exists(txt)
    assert.equal(txt!.Name, `mail.${domainName}`)
    assert.match(txt!.Value, /v=spf1 include:amazonses\.com/)
  }).timeout(AWS_TIMEOUT)

  test('wait for email identity to be verified', async ({ assert }) => {
    const records = await sesService.getAllRecordsForEmailIdentity(domainName)
    console.log('Records:', sesService.formatDNSRecordsForTheConsole(records))

    const verified = await sesService.verifyEmailIdentity(domainName)

    assert.isTrue(verified)
  })
    .timeout(5 * 60 * 1000) // 20 attempts × 15s = 5 min max
    .retry(2)

  test('send a test email', async ({ assert }) => {
    await wait(5000) // Just to ensure SES has fully processed the verification before we attempt to send
    const response = await sesService.sendEmailUsing(domainName, {
      to: VERIFIED_EMAIL,
      subject: 'Test email from SESService',
      text: 'This is a test email sent using the SESService in AdonisJS.',
    })
    assert.exists(response.MessageId)
  }).timeout(AWS_TIMEOUT)

  // test('send a test email using the SES mailer', async ({ assert }) => {
  //   const mailer = mail.use('ses').send((m) => {
  //     m.from(`test@${domainName}`)
  //     m.to('jeansamist@gmail.com')
  //     m.subject('Test email from SES mailer')
  //     m.text('This is a test email sent using the SES mailer in AdonisJS.')
  //   })
  // }).timeout(AWS_TIMEOUT)

  test('delete an email identity', async ({ assert }) => {
    const response = await sesService.deleteEmailIdentity(domainName)

    assert.equal(response.$metadata.httpStatusCode, 200)
  }).timeout(AWS_TIMEOUT)
})
