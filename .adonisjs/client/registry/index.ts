/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
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
  'mail_account_profiles.store': {
    methods: ["POST"],
    pattern: '/api/mail-accounts/:mailAccountId/profile',
    tokens: [{"old":"/api/mail-accounts/:mailAccountId/profile","type":0,"val":"api","end":""},{"old":"/api/mail-accounts/:mailAccountId/profile","type":0,"val":"mail-accounts","end":""},{"old":"/api/mail-accounts/:mailAccountId/profile","type":1,"val":"mailAccountId","end":""},{"old":"/api/mail-accounts/:mailAccountId/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['mail_account_profiles.store']['types'],
  },
  'mail_account_profiles.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/mail-accounts/:mailAccountId/profile',
    tokens: [{"old":"/api/mail-accounts/:mailAccountId/profile","type":0,"val":"api","end":""},{"old":"/api/mail-accounts/:mailAccountId/profile","type":0,"val":"mail-accounts","end":""},{"old":"/api/mail-accounts/:mailAccountId/profile","type":1,"val":"mailAccountId","end":""},{"old":"/api/mail-accounts/:mailAccountId/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['mail_account_profiles.show']['types'],
  },
  'mail_account_profiles.update': {
    methods: ["PUT"],
    pattern: '/api/mail-accounts/:mailAccountId/profile',
    tokens: [{"old":"/api/mail-accounts/:mailAccountId/profile","type":0,"val":"api","end":""},{"old":"/api/mail-accounts/:mailAccountId/profile","type":0,"val":"mail-accounts","end":""},{"old":"/api/mail-accounts/:mailAccountId/profile","type":1,"val":"mailAccountId","end":""},{"old":"/api/mail-accounts/:mailAccountId/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['mail_account_profiles.update']['types'],
  },
  'mail_account_profiles.destroy': {
    methods: ["DELETE"],
    pattern: '/api/mail-accounts/:mailAccountId/profile',
    tokens: [{"old":"/api/mail-accounts/:mailAccountId/profile","type":0,"val":"api","end":""},{"old":"/api/mail-accounts/:mailAccountId/profile","type":0,"val":"mail-accounts","end":""},{"old":"/api/mail-accounts/:mailAccountId/profile","type":1,"val":"mailAccountId","end":""},{"old":"/api/mail-accounts/:mailAccountId/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['mail_account_profiles.destroy']['types'],
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
