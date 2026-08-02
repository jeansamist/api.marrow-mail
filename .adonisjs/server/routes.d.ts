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
    'mail.drafts': { paramsTuple?: []; params?: {} }
    'mail.save_draft': { paramsTuple?: []; params?: {} }
    'mail.update_draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.delete_draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.send_draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.move_to_folder': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.mark_spam': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.mark_important': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.forward': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'folders.index': { paramsTuple?: []; params?: {} }
    'folders.store': { paramsTuple?: []; params?: {} }
    'folders.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'folders.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'folders.mails': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'contacts.index': { paramsTuple?: []; params?: {} }
    'contacts.store': { paramsTuple?: []; params?: {} }
    'contacts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'contacts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'contacts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'mail.drafts': { paramsTuple?: []; params?: {} }
    'folders.index': { paramsTuple?: []; params?: {} }
    'folders.mails': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'contacts.index': { paramsTuple?: []; params?: {} }
    'contacts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'mail.drafts': { paramsTuple?: []; params?: {} }
    'folders.index': { paramsTuple?: []; params?: {} }
    'folders.mails': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'contacts.index': { paramsTuple?: []; params?: {} }
    'contacts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'mail.save_draft': { paramsTuple?: []; params?: {} }
    'mail.send_draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.forward': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'folders.store': { paramsTuple?: []; params?: {} }
    'contacts.store': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'auth.update_profile': { paramsTuple?: []; params?: {} }
    'mail.update_draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.move_to_folder': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.mark_spam': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.mark_important': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'folders.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'contacts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'storage.delete_file': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'mail.delete_draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'folders.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'contacts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}