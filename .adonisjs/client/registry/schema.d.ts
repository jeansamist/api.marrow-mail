/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'ses_webhook': {
    methods: ["POST"]
    pattern: '/api/webhooks/ses'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ses_webhook_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ses_webhook_controller').default['handle']>>>
    }
  }
  'stripe_webhook': {
    methods: ["POST"]
    pattern: '/api/webhooks/stripe'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/stripe_webhook_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/stripe_webhook_controller').default['handle']>>>
    }
  }
  'elgiopay_webhook': {
    methods: ["POST"]
    pattern: '/api/webhooks/elgiopay'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/elgiopay_webhook_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/elgiopay_webhook_controller').default['handle']>>>
    }
  }
  'auth.sign_up': {
    methods: ["POST"]
    pattern: '/api/auth/sign-up'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').signUpValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').signUpValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['signUp']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['signUp']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.verify_email': {
    methods: ["POST"]
    pattern: '/api/auth/verify-email'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').verifyEmailValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').verifyEmailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['verifyEmail']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['verifyEmail']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.sign_in': {
    methods: ["POST"]
    pattern: '/api/auth/sign-in'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').signInValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').signInValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['signIn']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['signIn']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.forgot_password': {
    methods: ["POST"]
    pattern: '/api/auth/forgot-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').forgotPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').forgotPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['forgotPassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['forgotPassword']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.reset_password': {
    methods: ["POST"]
    pattern: '/api/auth/reset-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').resetPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').resetPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['resetPassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['resetPassword']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.logout': {
    methods: ["POST"]
    pattern: '/api/auth/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['logout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['logout']>>>
    }
  }
  'auth.delete_account': {
    methods: ["POST"]
    pattern: '/api/auth/delete-account'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['deleteAccount']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['deleteAccount']>>>
    }
  }
  'auth.profile': {
    methods: ["GET","HEAD"]
    pattern: '/api/auth/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['profile']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['profile']>>>
    }
  }
  'auth.update_profile': {
    methods: ["PUT"]
    pattern: '/api/auth/update-profile'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').updateUserValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').updateUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['updateProfile']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['updateProfile']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'mail_accounts.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/mail-accounts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_accounts_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_accounts_controller').default['index']>>>
    }
  }
  'mail_accounts.destroy': {
    methods: ["DELETE"]
    pattern: '/api/mail-accounts/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_accounts_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_accounts_controller').default['destroy']>>>
    }
  }
  'mail_account_profiles.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/mail-accounts/:mailAccountId/profile'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { mailAccountId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_account_profiles_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_account_profiles_controller').default['show']>>>
    }
  }
  'domains.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/domains'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/domains_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/domains_controller').default['index']>>>
    }
  }
  'domains.store': {
    methods: ["POST"]
    pattern: '/api/domains'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/domain').createDomainValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/domain').createDomainValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/domains_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/domains_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'domains.destroy': {
    methods: ["DELETE"]
    pattern: '/api/domains/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/domains_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/domains_controller').default['destroy']>>>
    }
  }
  'onboarding.register_domain': {
    methods: ["POST"]
    pattern: '/api/onboarding/register-domain'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/domain').createDomainValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/domain').createDomainValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/onboarding_controller').default['registerDomain']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/onboarding_controller').default['registerDomain']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'onboarding.setup_mail_account': {
    methods: ["POST"]
    pattern: '/api/onboarding/setup-mail-account'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/mail_account').createManyMailAccountsValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/mail_account').createManyMailAccountsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/onboarding_controller').default['setupMailAccount']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/onboarding_controller').default['setupMailAccount']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'onboarding.get_dns_records': {
    methods: ["GET","HEAD"]
    pattern: '/api/onboarding/get-dns-records'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/onboarding_controller').default['getDNSRecords']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/onboarding_controller').default['getDNSRecords']>>>
    }
  }
  'onboarding.check_domain_status': {
    methods: ["GET","HEAD"]
    pattern: '/api/onboarding/check-domain-status'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/onboarding_controller').default['checkDomainStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/onboarding_controller').default['checkDomainStatus']>>>
    }
  }
  'subscriptions.checkout': {
    methods: ["POST"]
    pattern: '/api/onboarding/checkout-subscription'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/subscription').checkoutSubscriptionValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/subscription').checkoutSubscriptionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/subscriptions_controller').default['checkout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/subscriptions_controller').default['checkout']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'subscriptions.status': {
    methods: ["GET","HEAD"]
    pattern: '/api/onboarding/subscription-status/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/subscriptions_controller').default['status']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/subscriptions_controller').default['status']>>>
    }
  }
  'auth_mail_accounts.login': {
    methods: ["POST"]
    pattern: '/api/mail/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').signInValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').signInValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['login']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['login']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth_mail_accounts.verify_two_factor': {
    methods: ["POST"]
    pattern: '/api/mail/auth/verify-2fa'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').verifyTwoFactorValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').verifyTwoFactorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['verifyTwoFactor']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['verifyTwoFactor']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth_mail_accounts.forgot_password': {
    methods: ["POST"]
    pattern: '/api/mail/auth/forgot-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').forgotPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').forgotPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['forgotPassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['forgotPassword']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth_mail_accounts.reset_password': {
    methods: ["POST"]
    pattern: '/api/mail/auth/reset-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').resetPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').resetPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['resetPassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['resetPassword']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth_mail_accounts.profile': {
    methods: ["GET","HEAD"]
    pattern: '/api/mail/auth/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['profile']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['profile']>>>
    }
  }
  'auth_mail_accounts.change_password': {
    methods: ["PUT"]
    pattern: '/api/mail/auth/change-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').changePasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').changePasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['changePassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['changePassword']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth_mail_accounts.setup_two_factor': {
    methods: ["POST"]
    pattern: '/api/mail/auth/2fa/setup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['setupTwoFactor']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['setupTwoFactor']>>>
    }
  }
  'auth_mail_accounts.enable_two_factor': {
    methods: ["POST"]
    pattern: '/api/mail/auth/2fa/enable'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').twoFactorCodeValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').twoFactorCodeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['enableTwoFactor']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['enableTwoFactor']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth_mail_accounts.disable_two_factor': {
    methods: ["POST"]
    pattern: '/api/mail/auth/2fa/disable'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').disableTwoFactorValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').disableTwoFactorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['disableTwoFactor']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_mail_accounts_controller').default['disableTwoFactor']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'mail_account_profiles.setup_mail_account_profile': {
    methods: ["POST"]
    pattern: '/api/mail/setup-profile'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/mail_account_profile').setupMailAccountProfileValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/mail_account_profile').setupMailAccountProfileValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_account_profiles_controller').default['setupMailAccountProfile']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_account_profiles_controller').default['setupMailAccountProfile']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'mail_account_profiles.update_profile': {
    methods: ["PUT"]
    pattern: '/api/mail/profile'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/mail_account_profile').updateMailAccountProfileValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/mail_account_profile').updateMailAccountProfileValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_account_profiles_controller').default['updateProfile']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_account_profiles_controller').default['updateProfile']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'mail_forwarding.set_forwarding_email': {
    methods: ["PUT"]
    pattern: '/api/mail/forwarding'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/mail_forwarding').setForwardingEmailValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/mail_forwarding').setForwardingEmailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_forwarding_controller').default['setForwardingEmail']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_forwarding_controller').default['setForwardingEmail']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'mail_forwarding.verify': {
    methods: ["POST"]
    pattern: '/api/mail/forwarding/verify'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/mail_forwarding').verifyForwardingEmailValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/mail_forwarding').verifyForwardingEmailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_forwarding_controller').default['verify']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_forwarding_controller').default['verify']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'mail_forwarding.update_preferences': {
    methods: ["PUT"]
    pattern: '/api/mail/forwarding/preferences'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/mail_forwarding').updateForwardingPreferencesValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/mail_forwarding').updateForwardingPreferencesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_forwarding_controller').default['updatePreferences']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_forwarding_controller').default['updatePreferences']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storage.create_upload_link': {
    methods: ["POST"]
    pattern: '/api/mail/storage/upload-link'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/storage').createUploadLinkValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/storage').createUploadLinkValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storage_controller').default['createUploadLink']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storage_controller').default['createUploadLink']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storage.create_upload_links': {
    methods: ["POST"]
    pattern: '/api/mail/storage/upload-links'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/storage').createUploadLinksValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/storage').createUploadLinksValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storage_controller').default['createUploadLinks']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storage_controller').default['createUploadLinks']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storage.files': {
    methods: ["GET","HEAD"]
    pattern: '/api/mail/storage/files'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storage_controller').default['files']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storage_controller').default['files']>>>
    }
  }
  'storage.delete_file': {
    methods: ["DELETE"]
    pattern: '/api/mail/storage/files/*'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { '*': ParamValue[] }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storage_controller').default['deleteFile']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storage_controller').default['deleteFile']>>>
    }
  }
  'storage.get_file': {
    methods: ["GET","HEAD"]
    pattern: '/api/mail/storage/files/*'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { '*': ParamValue[] }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storage_controller').default['getFile']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storage_controller').default['getFile']>>>
    }
  }
  'mail.send': {
    methods: ["POST"]
    pattern: '/api/mail/mails'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/mail').sendMailValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/mail').sendMailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['send']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['send']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'mail.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/mail/mails'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['index']>>>
    }
  }
  'mail.sent': {
    methods: ["GET","HEAD"]
    pattern: '/api/mail/mails/sent'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['sent']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['sent']>>>
    }
  }
  'mail.received': {
    methods: ["GET","HEAD"]
    pattern: '/api/mail/mails/received'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['received']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['received']>>>
    }
  }
  'mail.drafts': {
    methods: ["GET","HEAD"]
    pattern: '/api/mail/mails/drafts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['drafts']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['drafts']>>>
    }
  }
  'mail.save_draft': {
    methods: ["POST"]
    pattern: '/api/mail/mails/drafts'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/mail').draftMailValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/mail').draftMailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['saveDraft']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['saveDraft']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'mail.update_draft': {
    methods: ["PUT"]
    pattern: '/api/mail/mails/drafts/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/mail').draftMailValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/mail').draftMailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['updateDraft']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['updateDraft']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'mail.delete_draft': {
    methods: ["DELETE"]
    pattern: '/api/mail/mails/drafts/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['deleteDraft']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['deleteDraft']>>>
    }
  }
  'mail.send_draft': {
    methods: ["POST"]
    pattern: '/api/mail/mails/drafts/:id/send'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['sendDraft']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['sendDraft']>>>
    }
  }
  'mail.move_to_folder': {
    methods: ["PUT"]
    pattern: '/api/mail/mails/:id/folder'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/mail').moveMailToFolderValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/mail').moveMailToFolderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['moveToFolder']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['moveToFolder']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'mail.mark_spam': {
    methods: ["PUT"]
    pattern: '/api/mail/mails/:id/spam'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/mail').markSpamValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/mail').markSpamValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['markSpam']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['markSpam']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'mail.mark_important': {
    methods: ["PUT"]
    pattern: '/api/mail/mails/:id/star'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/mail').markImportantValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/mail').markImportantValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['markImportant']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['markImportant']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'mail.mark_read': {
    methods: ["PUT"]
    pattern: '/api/mail/mails/:id/read'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/mail').markReadValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/mail').markReadValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['markRead']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['markRead']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'mail.forward': {
    methods: ["POST"]
    pattern: '/api/mail/mails/:id/forward'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/mail').forwardMailValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/mail').forwardMailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['forward']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['forward']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'mail.scheduled': {
    methods: ["GET","HEAD"]
    pattern: '/api/mail/mails/scheduled'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['scheduled']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['scheduled']>>>
    }
  }
  'mail.schedule_mail': {
    methods: ["POST"]
    pattern: '/api/mail/mails/schedule'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/mail').scheduleMailValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/mail').scheduleMailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['scheduleMail']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['scheduleMail']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'mail.reschedule': {
    methods: ["PUT"]
    pattern: '/api/mail/mails/:id/schedule'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/mail').rescheduleMailValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/mail').rescheduleMailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['reschedule']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['reschedule']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'mail.cancel_schedule': {
    methods: ["DELETE"]
    pattern: '/api/mail/mails/:id/schedule'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['cancelSchedule']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['cancelSchedule']>>>
    }
  }
  'mail.trash_list': {
    methods: ["GET","HEAD"]
    pattern: '/api/mail/mails/trash'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['trashList']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['trashList']>>>
    }
  }
  'mail.spam_list': {
    methods: ["GET","HEAD"]
    pattern: '/api/mail/mails/spam'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['spamList']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['spamList']>>>
    }
  }
  'mail.trash': {
    methods: ["PUT"]
    pattern: '/api/mail/mails/:id/trash'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['trash']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['trash']>>>
    }
  }
  'mail.restore': {
    methods: ["PUT"]
    pattern: '/api/mail/mails/:id/restore'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['restore']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['restore']>>>
    }
  }
  'mail.destroy': {
    methods: ["DELETE"]
    pattern: '/api/mail/mails/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/mail_controller').default['destroy']>>>
    }
  }
  'folders.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/mail/folders'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['index']>>>
    }
  }
  'folders.store': {
    methods: ["POST"]
    pattern: '/api/mail/folders'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/folder').folderValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/folder').folderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'folders.update': {
    methods: ["PUT"]
    pattern: '/api/mail/folders/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/folder').folderValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/folder').folderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'folders.destroy': {
    methods: ["DELETE"]
    pattern: '/api/mail/folders/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['destroy']>>>
    }
  }
  'folders.mails': {
    methods: ["GET","HEAD"]
    pattern: '/api/mail/folders/:id/mails'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['mails']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['mails']>>>
    }
  }
  'contacts.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/mail/contacts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/contacts_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/contacts_controller').default['index']>>>
    }
  }
  'contacts.store': {
    methods: ["POST"]
    pattern: '/api/mail/contacts'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/contact').createContactValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/contact').createContactValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/contacts_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/contacts_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'contacts.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/mail/contacts/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/contacts_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/contacts_controller').default['show']>>>
    }
  }
  'contacts.update': {
    methods: ["PUT"]
    pattern: '/api/mail/contacts/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/contact').updateContactValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/contact').updateContactValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/contacts_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/contacts_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'contacts.destroy': {
    methods: ["DELETE"]
    pattern: '/api/mail/contacts/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/contacts_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/contacts_controller').default['destroy']>>>
    }
  }
  'signatures.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/mail/signature'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/signatures_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/signatures_controller').default['show']>>>
    }
  }
  'signatures.update': {
    methods: ["PUT"]
    pattern: '/api/mail/signature'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/signature').signatureValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/signature').signatureValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/signatures_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/signatures_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}
