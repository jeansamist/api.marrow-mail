/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  sesWebhook: typeof routes['ses_webhook']
  auth: {
    signUp: typeof routes['auth.sign_up']
    verifyEmail: typeof routes['auth.verify_email']
    signIn: typeof routes['auth.sign_in']
    forgotPassword: typeof routes['auth.forgot_password']
    resetPassword: typeof routes['auth.reset_password']
    logout: typeof routes['auth.logout']
    deleteAccount: typeof routes['auth.delete_account']
    profile: typeof routes['auth.profile']
    updateProfile: typeof routes['auth.update_profile']
  }
  mailAccountProfiles: {
    show: typeof routes['mail_account_profiles.show']
    setupMailAccountProfile: typeof routes['mail_account_profiles.setup_mail_account_profile']
  }
  onboarding: {
    registerDomain: typeof routes['onboarding.register_domain']
    setupMailAccount: typeof routes['onboarding.setup_mail_account']
    getDnsRecords: typeof routes['onboarding.get_dns_records']
    checkDomainStatus: typeof routes['onboarding.check_domain_status']
  }
  authMailAccounts: {
    login: typeof routes['auth_mail_accounts.login']
    forgotPassword: typeof routes['auth_mail_accounts.forgot_password']
    resetPassword: typeof routes['auth_mail_accounts.reset_password']
    profile: typeof routes['auth_mail_accounts.profile']
  }
  storage: {
    createUploadLink: typeof routes['storage.create_upload_link']
    createUploadLinks: typeof routes['storage.create_upload_links']
    files: typeof routes['storage.files']
    deleteFile: typeof routes['storage.delete_file']
    getFile: typeof routes['storage.get_file']
  }
  mail: {
    send: typeof routes['mail.send']
    index: typeof routes['mail.index']
    sent: typeof routes['mail.sent']
    received: typeof routes['mail.received']
  }
}
