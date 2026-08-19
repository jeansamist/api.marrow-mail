import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'ses_webhook': { paramsTuple?: []; params?: {} }
    'stripe_webhook': { paramsTuple?: []; params?: {} }
    'elgiopay_webhook': { paramsTuple?: []; params?: {} }
    'public_domains.public_branding': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'public_domains.by_hostname': { paramsTuple: [ParamValue]; params: {'hostname': ParamValue} }
    'auth.sign_up': { paramsTuple?: []; params?: {} }
    'auth.verify_email': { paramsTuple?: []; params?: {} }
    'auth.sign_in': { paramsTuple?: []; params?: {} }
    'auth.forgot_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.delete_account': { paramsTuple?: []; params?: {} }
    'auth.profile': { paramsTuple?: []; params?: {} }
    'auth.update_profile': { paramsTuple?: []; params?: {} }
    'mail_accounts.index': { paramsTuple?: []; params?: {} }
    'mail_accounts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail_account_profiles.show': { paramsTuple: [ParamValue]; params: {'mailAccountId': ParamValue} }
    'mail_accounts.update_storage_quota': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail_accounts.toggle_active': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail_accounts.resend_invite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'domains.index': { paramsTuple?: []; params?: {} }
    'domains.store': { paramsTuple?: []; params?: {} }
    'domains.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'domains.get_branding': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'domains.update_branding': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'domains.create_logo_upload_link': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storage_overview.usage': { paramsTuple?: []; params?: {} }
    'onboarding.register_domain': { paramsTuple?: []; params?: {} }
    'onboarding.setup_mail_account': { paramsTuple?: []; params?: {} }
    'onboarding.get_dns_records': { paramsTuple?: []; params?: {} }
    'onboarding.check_domain_status': { paramsTuple?: []; params?: {} }
    'subscriptions.checkout': { paramsTuple?: []; params?: {} }
    'subscriptions.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth_mail_accounts.login': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.verify_two_factor': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.forgot_password': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.reset_password': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.profile': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.change_password': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.setup_two_factor': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.enable_two_factor': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.disable_two_factor': { paramsTuple?: []; params?: {} }
    'mail_account_profiles.setup_mail_account_profile': { paramsTuple?: []; params?: {} }
    'mail_account_profiles.update_profile': { paramsTuple?: []; params?: {} }
    'mail_forwarding.set_forwarding_email': { paramsTuple?: []; params?: {} }
    'mail_forwarding.verify': { paramsTuple?: []; params?: {} }
    'mail_forwarding.update_preferences': { paramsTuple?: []; params?: {} }
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
    'mail.mark_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.forward': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.scheduled': { paramsTuple?: []; params?: {} }
    'mail.schedule_mail': { paramsTuple?: []; params?: {} }
    'mail.reschedule': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.cancel_schedule': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.trash_list': { paramsTuple?: []; params?: {} }
    'mail.spam_list': { paramsTuple?: []; params?: {} }
    'mail.trash': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.restore': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'signatures.show': { paramsTuple?: []; params?: {} }
    'signatures.update': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'public_domains.public_branding': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'public_domains.by_hostname': { paramsTuple: [ParamValue]; params: {'hostname': ParamValue} }
    'auth.profile': { paramsTuple?: []; params?: {} }
    'mail_accounts.index': { paramsTuple?: []; params?: {} }
    'mail_account_profiles.show': { paramsTuple: [ParamValue]; params: {'mailAccountId': ParamValue} }
    'domains.index': { paramsTuple?: []; params?: {} }
    'domains.get_branding': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storage_overview.usage': { paramsTuple?: []; params?: {} }
    'onboarding.get_dns_records': { paramsTuple?: []; params?: {} }
    'onboarding.check_domain_status': { paramsTuple?: []; params?: {} }
    'subscriptions.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth_mail_accounts.profile': { paramsTuple?: []; params?: {} }
    'storage.files': { paramsTuple?: []; params?: {} }
    'storage.get_file': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'mail.index': { paramsTuple?: []; params?: {} }
    'mail.sent': { paramsTuple?: []; params?: {} }
    'mail.received': { paramsTuple?: []; params?: {} }
    'mail.drafts': { paramsTuple?: []; params?: {} }
    'mail.scheduled': { paramsTuple?: []; params?: {} }
    'mail.trash_list': { paramsTuple?: []; params?: {} }
    'mail.spam_list': { paramsTuple?: []; params?: {} }
    'folders.index': { paramsTuple?: []; params?: {} }
    'folders.mails': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'contacts.index': { paramsTuple?: []; params?: {} }
    'contacts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'signatures.show': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'public_domains.public_branding': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'public_domains.by_hostname': { paramsTuple: [ParamValue]; params: {'hostname': ParamValue} }
    'auth.profile': { paramsTuple?: []; params?: {} }
    'mail_accounts.index': { paramsTuple?: []; params?: {} }
    'mail_account_profiles.show': { paramsTuple: [ParamValue]; params: {'mailAccountId': ParamValue} }
    'domains.index': { paramsTuple?: []; params?: {} }
    'domains.get_branding': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storage_overview.usage': { paramsTuple?: []; params?: {} }
    'onboarding.get_dns_records': { paramsTuple?: []; params?: {} }
    'onboarding.check_domain_status': { paramsTuple?: []; params?: {} }
    'subscriptions.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth_mail_accounts.profile': { paramsTuple?: []; params?: {} }
    'storage.files': { paramsTuple?: []; params?: {} }
    'storage.get_file': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'mail.index': { paramsTuple?: []; params?: {} }
    'mail.sent': { paramsTuple?: []; params?: {} }
    'mail.received': { paramsTuple?: []; params?: {} }
    'mail.drafts': { paramsTuple?: []; params?: {} }
    'mail.scheduled': { paramsTuple?: []; params?: {} }
    'mail.trash_list': { paramsTuple?: []; params?: {} }
    'mail.spam_list': { paramsTuple?: []; params?: {} }
    'folders.index': { paramsTuple?: []; params?: {} }
    'folders.mails': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'contacts.index': { paramsTuple?: []; params?: {} }
    'contacts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'signatures.show': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'ses_webhook': { paramsTuple?: []; params?: {} }
    'stripe_webhook': { paramsTuple?: []; params?: {} }
    'elgiopay_webhook': { paramsTuple?: []; params?: {} }
    'auth.sign_up': { paramsTuple?: []; params?: {} }
    'auth.verify_email': { paramsTuple?: []; params?: {} }
    'auth.sign_in': { paramsTuple?: []; params?: {} }
    'auth.forgot_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.delete_account': { paramsTuple?: []; params?: {} }
    'mail_accounts.resend_invite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'domains.store': { paramsTuple?: []; params?: {} }
    'domains.create_logo_upload_link': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'onboarding.register_domain': { paramsTuple?: []; params?: {} }
    'onboarding.setup_mail_account': { paramsTuple?: []; params?: {} }
    'subscriptions.checkout': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.login': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.verify_two_factor': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.forgot_password': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.reset_password': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.setup_two_factor': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.enable_two_factor': { paramsTuple?: []; params?: {} }
    'auth_mail_accounts.disable_two_factor': { paramsTuple?: []; params?: {} }
    'mail_account_profiles.setup_mail_account_profile': { paramsTuple?: []; params?: {} }
    'mail_forwarding.verify': { paramsTuple?: []; params?: {} }
    'storage.create_upload_link': { paramsTuple?: []; params?: {} }
    'storage.create_upload_links': { paramsTuple?: []; params?: {} }
    'mail.send': { paramsTuple?: []; params?: {} }
    'mail.save_draft': { paramsTuple?: []; params?: {} }
    'mail.send_draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.forward': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.schedule_mail': { paramsTuple?: []; params?: {} }
    'folders.store': { paramsTuple?: []; params?: {} }
    'contacts.store': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'auth.update_profile': { paramsTuple?: []; params?: {} }
    'mail_accounts.update_storage_quota': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail_accounts.toggle_active': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'domains.update_branding': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth_mail_accounts.change_password': { paramsTuple?: []; params?: {} }
    'mail_account_profiles.update_profile': { paramsTuple?: []; params?: {} }
    'mail_forwarding.set_forwarding_email': { paramsTuple?: []; params?: {} }
    'mail_forwarding.update_preferences': { paramsTuple?: []; params?: {} }
    'mail.update_draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.move_to_folder': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.mark_spam': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.mark_important': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.mark_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.reschedule': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.trash': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.restore': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'folders.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'contacts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'signatures.update': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'mail_accounts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'domains.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storage.delete_file': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'mail.delete_draft': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.cancel_schedule': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'mail.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'folders.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'contacts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}