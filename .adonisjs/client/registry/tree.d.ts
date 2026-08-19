/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  sesWebhook: typeof routes['ses_webhook']
  stripeWebhook: typeof routes['stripe_webhook']
  elgiopayWebhook: typeof routes['elgiopay_webhook']
  publicDomains: {
    publicBranding: typeof routes['public_domains.public_branding']
    byHostname: typeof routes['public_domains.by_hostname']
  }
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
  mailAccounts: {
    index: typeof routes['mail_accounts.index']
    destroy: typeof routes['mail_accounts.destroy']
    updateStorageQuota: typeof routes['mail_accounts.update_storage_quota']
    toggleActive: typeof routes['mail_accounts.toggle_active']
    resendInvite: typeof routes['mail_accounts.resend_invite']
  }
  mailAccountProfiles: {
    show: typeof routes['mail_account_profiles.show']
    setupMailAccountProfile: typeof routes['mail_account_profiles.setup_mail_account_profile']
    updateProfile: typeof routes['mail_account_profiles.update_profile']
  }
  domains: {
    index: typeof routes['domains.index']
    store: typeof routes['domains.store']
    destroy: typeof routes['domains.destroy']
    getBranding: typeof routes['domains.get_branding']
    updateBranding: typeof routes['domains.update_branding']
    createLogoUploadLink: typeof routes['domains.create_logo_upload_link']
  }
  storageOverview: {
    usage: typeof routes['storage_overview.usage']
  }
  onboarding: {
    registerDomain: typeof routes['onboarding.register_domain']
    setupMailAccount: typeof routes['onboarding.setup_mail_account']
    getDnsRecords: typeof routes['onboarding.get_dns_records']
    checkDomainStatus: typeof routes['onboarding.check_domain_status']
  }
  subscriptions: {
    checkout: typeof routes['subscriptions.checkout']
    status: typeof routes['subscriptions.status']
  }
  authMailAccounts: {
    login: typeof routes['auth_mail_accounts.login']
    verifyTwoFactor: typeof routes['auth_mail_accounts.verify_two_factor']
    forgotPassword: typeof routes['auth_mail_accounts.forgot_password']
    resetPassword: typeof routes['auth_mail_accounts.reset_password']
    profile: typeof routes['auth_mail_accounts.profile']
    changePassword: typeof routes['auth_mail_accounts.change_password']
    setupTwoFactor: typeof routes['auth_mail_accounts.setup_two_factor']
    enableTwoFactor: typeof routes['auth_mail_accounts.enable_two_factor']
    disableTwoFactor: typeof routes['auth_mail_accounts.disable_two_factor']
  }
  mailForwarding: {
    setForwardingEmail: typeof routes['mail_forwarding.set_forwarding_email']
    verify: typeof routes['mail_forwarding.verify']
    updatePreferences: typeof routes['mail_forwarding.update_preferences']
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
    drafts: typeof routes['mail.drafts']
    saveDraft: typeof routes['mail.save_draft']
    updateDraft: typeof routes['mail.update_draft']
    deleteDraft: typeof routes['mail.delete_draft']
    sendDraft: typeof routes['mail.send_draft']
    moveToFolder: typeof routes['mail.move_to_folder']
    markSpam: typeof routes['mail.mark_spam']
    markImportant: typeof routes['mail.mark_important']
    markRead: typeof routes['mail.mark_read']
    forward: typeof routes['mail.forward']
    scheduled: typeof routes['mail.scheduled']
    scheduleMail: typeof routes['mail.schedule_mail']
    reschedule: typeof routes['mail.reschedule']
    cancelSchedule: typeof routes['mail.cancel_schedule']
    trashList: typeof routes['mail.trash_list']
    spamList: typeof routes['mail.spam_list']
    trash: typeof routes['mail.trash']
    restore: typeof routes['mail.restore']
    destroy: typeof routes['mail.destroy']
  }
  folders: {
    index: typeof routes['folders.index']
    store: typeof routes['folders.store']
    update: typeof routes['folders.update']
    destroy: typeof routes['folders.destroy']
    mails: typeof routes['folders.mails']
  }
  contacts: {
    index: typeof routes['contacts.index']
    store: typeof routes['contacts.store']
    show: typeof routes['contacts.show']
    update: typeof routes['contacts.update']
    destroy: typeof routes['contacts.destroy']
  }
  signatures: {
    show: typeof routes['signatures.show']
    update: typeof routes['signatures.update']
  }
}
