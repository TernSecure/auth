

export type GoogleOneTapStrategy = 'google_one_tap';
export type PasskeyStrategy = 'passkey';
export type PasswordStrategy = 'password';
export type PhoneCodeStrategy = 'phone_code';
export type EmailCodeStrategy = 'email_code';
export type EmailLinkStrategy = 'email_link';
export type TicketStrategy = 'ticket';
export type TOTPStrategy = 'totp';
export type BackupCodeStrategy = 'backup_code';
export type ResetPasswordPhoneCodeStrategy = 'reset_password_phone_code';
export type ResetPasswordEmailCodeStrategy = 'reset_password_email_code';
export type CustomOAuthStrategy = `oauth_custom_${string}`;
export type EnterpriseSSOStrategy = 'enterprise_sso';