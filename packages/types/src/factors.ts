
import type {
  BackupCodeStrategy,
  EmailCodeStrategy,
  EmailLinkStrategy,
  EnterpriseSSOStrategy,
  PasskeyStrategy,
  PasswordStrategy,
  PhoneCodeStrategy,
  ResetPasswordEmailCodeStrategy,
  ResetPasswordPhoneCodeStrategy,
  TOTPStrategy,
} from './strategies';

export type EmailCodeFactor = {
  strategy: EmailCodeStrategy;
  emailAddressId: string;
  safeIdentifier: string;
  primary?: boolean;
};

export type EmailLinkFactor = {
  strategy: EmailLinkStrategy;
  emailAddressId: string;
  safeIdentifier: string;
  primary?: boolean;
};

export type PhoneCodeFactor = {
  strategy: PhoneCodeStrategy;
  phoneNumberId: string;
  safeIdentifier: string;
  primary?: boolean;
  default?: boolean;
};


export type PasswordFactor = {
  strategy: PasswordStrategy;
};

export type PasskeyFactor = {
  strategy: PasskeyStrategy;
};


export type EnterpriseSSOFactor = {
  strategy: EnterpriseSSOStrategy;
};

export type TOTPFactor = {
  strategy: TOTPStrategy;
};

export type BackupCodeFactor = {
  strategy: BackupCodeStrategy;
};

export type ResetPasswordPhoneCodeFactor = {
  strategy: ResetPasswordPhoneCodeStrategy;
  phoneNumberId: string;
  safeIdentifier: string;
  primary?: boolean;
};

export type ResetPasswordEmailCodeFactor = {
  strategy: ResetPasswordEmailCodeStrategy;
  emailAddressId: string;
  safeIdentifier: string;
  primary?: boolean;
};

export type ResetPasswordCodeFactor = ResetPasswordEmailCodeFactor | ResetPasswordPhoneCodeFactor;

export type ResetPasswordPhoneCodeFactorConfig = Omit<ResetPasswordPhoneCodeFactor, 'safeIdentifier'>;
export type ResetPasswordEmailCodeFactorConfig = Omit<ResetPasswordEmailCodeFactor, 'safeIdentifier'>;

export type EmailCodeConfig = Omit<EmailCodeFactor, 'safeIdentifier'>;
export type EmailLinkConfig = Omit<EmailLinkFactor, 'safeIdentifier'> & {
  redirectUrl: string;
};
export type PhoneCodeConfig = Omit<PhoneCodeFactor, 'safeIdentifier'>;

export type PassKeyConfig = PasskeyFactor;

export type EnterpriseSSOConfig = EnterpriseSSOFactor & {
  redirectUrl: string;
  actionCompleteRedirectUrl: string;
  oidcPrompt?: string;
};

export type PhoneCodeSecondFactorConfig = {
  strategy: PhoneCodeStrategy;
  phoneNumberId?: string;
};

export type EmailCodeAttempt = {
  strategy: EmailCodeStrategy;
  code: string;
};

export type PhoneCodeAttempt = {
  strategy: PhoneCodeStrategy;
  code: string;
};

export type PasswordAttempt = {
  strategy: PasswordStrategy;
  password: string;
};

export type TOTPAttempt = {
  strategy: TOTPStrategy;
  code: string;
};

export type BackupCodeAttempt = {
  strategy: BackupCodeStrategy;
  code: string;
};

export type ResetPasswordPhoneCodeAttempt = {
  strategy: ResetPasswordPhoneCodeStrategy;
  code: string;
  password?: string;
};

export type ResetPasswordEmailCodeAttempt = {
  strategy: ResetPasswordEmailCodeStrategy;
  code: string;
  password?: string;
};
