/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
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
}
