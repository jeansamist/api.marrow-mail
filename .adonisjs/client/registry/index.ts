/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'ses_webhook': {
    methods: ["POST"],
    pattern: '/api/webhooks/ses',
    tokens: [{"old":"/api/webhooks/ses","type":0,"val":"api","end":""},{"old":"/api/webhooks/ses","type":0,"val":"webhooks","end":""},{"old":"/api/webhooks/ses","type":0,"val":"ses","end":""}],
    types: placeholder as Registry['ses_webhook']['types'],
  },
  'auth.sign_up': {
    methods: ["POST"],
    pattern: '/api/auth/sign-up',
    tokens: [{"old":"/api/auth/sign-up","type":0,"val":"api","end":""},{"old":"/api/auth/sign-up","type":0,"val":"auth","end":""},{"old":"/api/auth/sign-up","type":0,"val":"sign-up","end":""}],
    types: placeholder as Registry['auth.sign_up']['types'],
  },
  'auth.verify_email': {
    methods: ["POST"],
    pattern: '/api/auth/verify-email',
    tokens: [{"old":"/api/auth/verify-email","type":0,"val":"api","end":""},{"old":"/api/auth/verify-email","type":0,"val":"auth","end":""},{"old":"/api/auth/verify-email","type":0,"val":"verify-email","end":""}],
    types: placeholder as Registry['auth.verify_email']['types'],
  },
  'auth.sign_in': {
    methods: ["POST"],
    pattern: '/api/auth/sign-in',
    tokens: [{"old":"/api/auth/sign-in","type":0,"val":"api","end":""},{"old":"/api/auth/sign-in","type":0,"val":"auth","end":""},{"old":"/api/auth/sign-in","type":0,"val":"sign-in","end":""}],
    types: placeholder as Registry['auth.sign_in']['types'],
  },
  'auth.forgot_password': {
    methods: ["POST"],
    pattern: '/api/auth/forgot-password',
    tokens: [{"old":"/api/auth/forgot-password","type":0,"val":"api","end":""},{"old":"/api/auth/forgot-password","type":0,"val":"auth","end":""},{"old":"/api/auth/forgot-password","type":0,"val":"forgot-password","end":""}],
    types: placeholder as Registry['auth.forgot_password']['types'],
  },
  'auth.reset_password': {
    methods: ["POST"],
    pattern: '/api/auth/reset-password',
    tokens: [{"old":"/api/auth/reset-password","type":0,"val":"api","end":""},{"old":"/api/auth/reset-password","type":0,"val":"auth","end":""},{"old":"/api/auth/reset-password","type":0,"val":"reset-password","end":""}],
    types: placeholder as Registry['auth.reset_password']['types'],
  },
  'auth.logout': {
    methods: ["POST"],
    pattern: '/api/auth/logout',
    tokens: [{"old":"/api/auth/logout","type":0,"val":"api","end":""},{"old":"/api/auth/logout","type":0,"val":"auth","end":""},{"old":"/api/auth/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['auth.logout']['types'],
  },
  'auth.delete_account': {
    methods: ["POST"],
    pattern: '/api/auth/delete-account',
    tokens: [{"old":"/api/auth/delete-account","type":0,"val":"api","end":""},{"old":"/api/auth/delete-account","type":0,"val":"auth","end":""},{"old":"/api/auth/delete-account","type":0,"val":"delete-account","end":""}],
    types: placeholder as Registry['auth.delete_account']['types'],
  },
  'auth.profile': {
    methods: ["GET","HEAD"],
    pattern: '/api/auth/profile',
    tokens: [{"old":"/api/auth/profile","type":0,"val":"api","end":""},{"old":"/api/auth/profile","type":0,"val":"auth","end":""},{"old":"/api/auth/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['auth.profile']['types'],
  },
  'auth.update_profile': {
    methods: ["PUT"],
    pattern: '/api/auth/update-profile',
    tokens: [{"old":"/api/auth/update-profile","type":0,"val":"api","end":""},{"old":"/api/auth/update-profile","type":0,"val":"auth","end":""},{"old":"/api/auth/update-profile","type":0,"val":"update-profile","end":""}],
    types: placeholder as Registry['auth.update_profile']['types'],
  },
  'mail_account_profiles.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/mail-accounts/:mailAccountId/profile',
    tokens: [{"old":"/api/mail-accounts/:mailAccountId/profile","type":0,"val":"api","end":""},{"old":"/api/mail-accounts/:mailAccountId/profile","type":0,"val":"mail-accounts","end":""},{"old":"/api/mail-accounts/:mailAccountId/profile","type":1,"val":"mailAccountId","end":""},{"old":"/api/mail-accounts/:mailAccountId/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['mail_account_profiles.show']['types'],
  },
  'onboarding.register_domain': {
    methods: ["POST"],
    pattern: '/api/onboarding/register-domain',
    tokens: [{"old":"/api/onboarding/register-domain","type":0,"val":"api","end":""},{"old":"/api/onboarding/register-domain","type":0,"val":"onboarding","end":""},{"old":"/api/onboarding/register-domain","type":0,"val":"register-domain","end":""}],
    types: placeholder as Registry['onboarding.register_domain']['types'],
  },
  'onboarding.setup_mail_account': {
    methods: ["POST"],
    pattern: '/api/onboarding/setup-mail-account',
    tokens: [{"old":"/api/onboarding/setup-mail-account","type":0,"val":"api","end":""},{"old":"/api/onboarding/setup-mail-account","type":0,"val":"onboarding","end":""},{"old":"/api/onboarding/setup-mail-account","type":0,"val":"setup-mail-account","end":""}],
    types: placeholder as Registry['onboarding.setup_mail_account']['types'],
  },
  'onboarding.get_dns_records': {
    methods: ["GET","HEAD"],
    pattern: '/api/onboarding/get-dns-records',
    tokens: [{"old":"/api/onboarding/get-dns-records","type":0,"val":"api","end":""},{"old":"/api/onboarding/get-dns-records","type":0,"val":"onboarding","end":""},{"old":"/api/onboarding/get-dns-records","type":0,"val":"get-dns-records","end":""}],
    types: placeholder as Registry['onboarding.get_dns_records']['types'],
  },
  'onboarding.check_domain_status': {
    methods: ["GET","HEAD"],
    pattern: '/api/onboarding/check-domain-status',
    tokens: [{"old":"/api/onboarding/check-domain-status","type":0,"val":"api","end":""},{"old":"/api/onboarding/check-domain-status","type":0,"val":"onboarding","end":""},{"old":"/api/onboarding/check-domain-status","type":0,"val":"check-domain-status","end":""}],
    types: placeholder as Registry['onboarding.check_domain_status']['types'],
  },
  'auth_mail_accounts.login': {
    methods: ["POST"],
    pattern: '/api/mail/auth/login',
    tokens: [{"old":"/api/mail/auth/login","type":0,"val":"api","end":""},{"old":"/api/mail/auth/login","type":0,"val":"mail","end":""},{"old":"/api/mail/auth/login","type":0,"val":"auth","end":""},{"old":"/api/mail/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth_mail_accounts.login']['types'],
  },
  'auth_mail_accounts.forgot_password': {
    methods: ["POST"],
    pattern: '/api/mail/auth/forgot-password',
    tokens: [{"old":"/api/mail/auth/forgot-password","type":0,"val":"api","end":""},{"old":"/api/mail/auth/forgot-password","type":0,"val":"mail","end":""},{"old":"/api/mail/auth/forgot-password","type":0,"val":"auth","end":""},{"old":"/api/mail/auth/forgot-password","type":0,"val":"forgot-password","end":""}],
    types: placeholder as Registry['auth_mail_accounts.forgot_password']['types'],
  },
  'auth_mail_accounts.reset_password': {
    methods: ["POST"],
    pattern: '/api/mail/auth/reset-password',
    tokens: [{"old":"/api/mail/auth/reset-password","type":0,"val":"api","end":""},{"old":"/api/mail/auth/reset-password","type":0,"val":"mail","end":""},{"old":"/api/mail/auth/reset-password","type":0,"val":"auth","end":""},{"old":"/api/mail/auth/reset-password","type":0,"val":"reset-password","end":""}],
    types: placeholder as Registry['auth_mail_accounts.reset_password']['types'],
  },
  'auth_mail_accounts.profile': {
    methods: ["GET","HEAD"],
    pattern: '/api/mail/auth/profile',
    tokens: [{"old":"/api/mail/auth/profile","type":0,"val":"api","end":""},{"old":"/api/mail/auth/profile","type":0,"val":"mail","end":""},{"old":"/api/mail/auth/profile","type":0,"val":"auth","end":""},{"old":"/api/mail/auth/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['auth_mail_accounts.profile']['types'],
  },
  'mail_account_profiles.setup_mail_account_profile': {
    methods: ["POST"],
    pattern: '/api/mail/setup-profile',
    tokens: [{"old":"/api/mail/setup-profile","type":0,"val":"api","end":""},{"old":"/api/mail/setup-profile","type":0,"val":"mail","end":""},{"old":"/api/mail/setup-profile","type":0,"val":"setup-profile","end":""}],
    types: placeholder as Registry['mail_account_profiles.setup_mail_account_profile']['types'],
  },
  'storage.create_upload_link': {
    methods: ["POST"],
    pattern: '/api/mail/storage/upload-link',
    tokens: [{"old":"/api/mail/storage/upload-link","type":0,"val":"api","end":""},{"old":"/api/mail/storage/upload-link","type":0,"val":"mail","end":""},{"old":"/api/mail/storage/upload-link","type":0,"val":"storage","end":""},{"old":"/api/mail/storage/upload-link","type":0,"val":"upload-link","end":""}],
    types: placeholder as Registry['storage.create_upload_link']['types'],
  },
  'storage.create_upload_links': {
    methods: ["POST"],
    pattern: '/api/mail/storage/upload-links',
    tokens: [{"old":"/api/mail/storage/upload-links","type":0,"val":"api","end":""},{"old":"/api/mail/storage/upload-links","type":0,"val":"mail","end":""},{"old":"/api/mail/storage/upload-links","type":0,"val":"storage","end":""},{"old":"/api/mail/storage/upload-links","type":0,"val":"upload-links","end":""}],
    types: placeholder as Registry['storage.create_upload_links']['types'],
  },
  'storage.files': {
    methods: ["GET","HEAD"],
    pattern: '/api/mail/storage/files',
    tokens: [{"old":"/api/mail/storage/files","type":0,"val":"api","end":""},{"old":"/api/mail/storage/files","type":0,"val":"mail","end":""},{"old":"/api/mail/storage/files","type":0,"val":"storage","end":""},{"old":"/api/mail/storage/files","type":0,"val":"files","end":""}],
    types: placeholder as Registry['storage.files']['types'],
  },
  'storage.delete_file': {
    methods: ["DELETE"],
    pattern: '/api/mail/storage/files/*',
    tokens: [{"old":"/api/mail/storage/files/*","type":0,"val":"api","end":""},{"old":"/api/mail/storage/files/*","type":0,"val":"mail","end":""},{"old":"/api/mail/storage/files/*","type":0,"val":"storage","end":""},{"old":"/api/mail/storage/files/*","type":0,"val":"files","end":""},{"old":"/api/mail/storage/files/*","type":2,"val":"*","end":""}],
    types: placeholder as Registry['storage.delete_file']['types'],
  },
  'storage.get_file': {
    methods: ["GET","HEAD"],
    pattern: '/api/mail/storage/files/*',
    tokens: [{"old":"/api/mail/storage/files/*","type":0,"val":"api","end":""},{"old":"/api/mail/storage/files/*","type":0,"val":"mail","end":""},{"old":"/api/mail/storage/files/*","type":0,"val":"storage","end":""},{"old":"/api/mail/storage/files/*","type":0,"val":"files","end":""},{"old":"/api/mail/storage/files/*","type":2,"val":"*","end":""}],
    types: placeholder as Registry['storage.get_file']['types'],
  },
  'mail.send': {
    methods: ["POST"],
    pattern: '/api/mail/mails',
    tokens: [{"old":"/api/mail/mails","type":0,"val":"api","end":""},{"old":"/api/mail/mails","type":0,"val":"mail","end":""},{"old":"/api/mail/mails","type":0,"val":"mails","end":""}],
    types: placeholder as Registry['mail.send']['types'],
  },
  'mail.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/mail/mails',
    tokens: [{"old":"/api/mail/mails","type":0,"val":"api","end":""},{"old":"/api/mail/mails","type":0,"val":"mail","end":""},{"old":"/api/mail/mails","type":0,"val":"mails","end":""}],
    types: placeholder as Registry['mail.index']['types'],
  },
  'mail.sent': {
    methods: ["GET","HEAD"],
    pattern: '/api/mail/mails/sent',
    tokens: [{"old":"/api/mail/mails/sent","type":0,"val":"api","end":""},{"old":"/api/mail/mails/sent","type":0,"val":"mail","end":""},{"old":"/api/mail/mails/sent","type":0,"val":"mails","end":""},{"old":"/api/mail/mails/sent","type":0,"val":"sent","end":""}],
    types: placeholder as Registry['mail.sent']['types'],
  },
  'mail.received': {
    methods: ["GET","HEAD"],
    pattern: '/api/mail/mails/received',
    tokens: [{"old":"/api/mail/mails/received","type":0,"val":"api","end":""},{"old":"/api/mail/mails/received","type":0,"val":"mail","end":""},{"old":"/api/mail/mails/received","type":0,"val":"mails","end":""},{"old":"/api/mail/mails/received","type":0,"val":"received","end":""}],
    types: placeholder as Registry['mail.received']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
