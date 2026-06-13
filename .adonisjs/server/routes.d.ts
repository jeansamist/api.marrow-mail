import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.sign_up': { paramsTuple?: []; params?: {} }
    'auth.verify_email': { paramsTuple?: []; params?: {} }
    'auth.sign_in': { paramsTuple?: []; params?: {} }
    'auth.forgot_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.delete_account': { paramsTuple?: []; params?: {} }
    'auth.profile': { paramsTuple?: []; params?: {} }
    'auth.update_profile': { paramsTuple?: []; params?: {} }
    'mail_account_profiles.store': { paramsTuple: [ParamValue]; params: {'mailAccountId': ParamValue} }
    'mail_account_profiles.show': { paramsTuple: [ParamValue]; params: {'mailAccountId': ParamValue} }
    'mail_account_profiles.update': { paramsTuple: [ParamValue]; params: {'mailAccountId': ParamValue} }
    'mail_account_profiles.destroy': { paramsTuple: [ParamValue]; params: {'mailAccountId': ParamValue} }
    'onboarding.register_domain': { paramsTuple?: []; params?: {} }
    'onboarding.setup_mail_account': { paramsTuple?: []; params?: {} }
    'onboarding.get_dns_records': { paramsTuple?: []; params?: {} }
    'onboarding.check_domain_status': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'auth.profile': { paramsTuple?: []; params?: {} }
    'mail_account_profiles.show': { paramsTuple: [ParamValue]; params: {'mailAccountId': ParamValue} }
    'onboarding.get_dns_records': { paramsTuple?: []; params?: {} }
    'onboarding.check_domain_status': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'auth.profile': { paramsTuple?: []; params?: {} }
    'mail_account_profiles.show': { paramsTuple: [ParamValue]; params: {'mailAccountId': ParamValue} }
    'onboarding.get_dns_records': { paramsTuple?: []; params?: {} }
    'onboarding.check_domain_status': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.sign_up': { paramsTuple?: []; params?: {} }
    'auth.verify_email': { paramsTuple?: []; params?: {} }
    'auth.sign_in': { paramsTuple?: []; params?: {} }
    'auth.forgot_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.delete_account': { paramsTuple?: []; params?: {} }
    'mail_account_profiles.store': { paramsTuple: [ParamValue]; params: {'mailAccountId': ParamValue} }
    'onboarding.register_domain': { paramsTuple?: []; params?: {} }
    'onboarding.setup_mail_account': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'auth.update_profile': { paramsTuple?: []; params?: {} }
    'mail_account_profiles.update': { paramsTuple: [ParamValue]; params: {'mailAccountId': ParamValue} }
  }
  DELETE: {
    'mail_account_profiles.destroy': { paramsTuple: [ParamValue]; params: {'mailAccountId': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}