import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'ses_webhook': { paramsTuple?: []; params?: {} }
    'auth.sign_up': { paramsTuple?: []; params?: {} }
    'auth.verify_email': { paramsTuple?: []; params?: {} }
    'auth.sign_in': { paramsTuple?: []; params?: {} }
    'auth.forgot_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.delete_account': { paramsTuple?: []; params?: {} }
    'auth.profile': { paramsTuple?: []; params?: {} }
    'auth.update_profile': { paramsTuple?: []; params?: {} }
    'mail_account_profiles.show': { paramsTuple: [ParamValue]; params: {'mailAccountId': ParamValue} }
    'onboarding.register_domain': { paramsTuple?: []; params?: {} }
    'onboarding.setup_mail_account': { paramsTuple?: []; params?: {} }
    'onboarding.get_dns_records': { paramsTuple?: []; params?: {} }
    'onboarding.check_domain_status': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.login': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.forgot_password': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.reset_password': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.profile': { paramsTuple?: []; params?: {} }
    'mail_account_profiles.setup_mail_account_profile': { paramsTuple?: []; params?: {} }
    'storage.create_upload_link': { paramsTuple?: []; params?: {} }
    'storage.create_upload_links': { paramsTuple?: []; params?: {} }
    'storage.files': { paramsTuple?: []; params?: {} }
    'storage.delete_file': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'storage.get_file': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'mail.send': { paramsTuple?: []; params?: {} }
    'mail.index': { paramsTuple?: []; params?: {} }
    'mail.sent': { paramsTuple?: []; params?: {} }
    'mail.received': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'auth.profile': { paramsTuple?: []; params?: {} }
    'mail_account_profiles.show': { paramsTuple: [ParamValue]; params: {'mailAccountId': ParamValue} }
    'onboarding.get_dns_records': { paramsTuple?: []; params?: {} }
    'onboarding.check_domain_status': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.profile': { paramsTuple?: []; params?: {} }
    'storage.files': { paramsTuple?: []; params?: {} }
    'storage.get_file': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'mail.index': { paramsTuple?: []; params?: {} }
    'mail.sent': { paramsTuple?: []; params?: {} }
    'mail.received': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'auth.profile': { paramsTuple?: []; params?: {} }
    'mail_account_profiles.show': { paramsTuple: [ParamValue]; params: {'mailAccountId': ParamValue} }
    'onboarding.get_dns_records': { paramsTuple?: []; params?: {} }
    'onboarding.check_domain_status': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.profile': { paramsTuple?: []; params?: {} }
    'storage.files': { paramsTuple?: []; params?: {} }
    'storage.get_file': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'mail.index': { paramsTuple?: []; params?: {} }
    'mail.sent': { paramsTuple?: []; params?: {} }
    'mail.received': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'ses_webhook': { paramsTuple?: []; params?: {} }
    'auth.sign_up': { paramsTuple?: []; params?: {} }
    'auth.verify_email': { paramsTuple?: []; params?: {} }
    'auth.sign_in': { paramsTuple?: []; params?: {} }
    'auth.forgot_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.delete_account': { paramsTuple?: []; params?: {} }
    'onboarding.register_domain': { paramsTuple?: []; params?: {} }
    'onboarding.setup_mail_account': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.login': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.forgot_password': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.reset_password': { paramsTuple?: []; params?: {} }
    'mail_account_profiles.setup_mail_account_profile': { paramsTuple?: []; params?: {} }
    'storage.create_upload_link': { paramsTuple?: []; params?: {} }
    'storage.create_upload_links': { paramsTuple?: []; params?: {} }
    'mail.send': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'auth.update_profile': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'storage.delete_file': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}