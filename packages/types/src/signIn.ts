import type { UserCredential } from "./all";
import type { ErrorCode } from "./errors";
import type {
  EmailCodeAttempt,
  PasswordAttempt,
  PhoneCodeAttempt,
  ResetPasswordEmailCodeAttempt,
  ResetPasswordPhoneCodeAttempt
} from './factors'
import type { TernSecureResourceJSON } from './json'
import type {
  EmailCodeStrategy,
  PasswordStrategy,
  PhoneCodeStrategy,
  ResetPasswordEmailCodeStrategy,
  ResetPasswordPhoneCodeStrategy
} from "./strategies";

export type SignInStatus =
  | 'needs_identifier'
  | 'needs_first_factor'
  | 'needs_second_factor'
  | 'needs_new_password'
  | 'idle'
  | 'pending_email_password'
  | 'pending_social'
  | 'pending_mfa'
  | 'redirecting'
  | 'success'
  | 'error';


/**
 * @deprecated Use `SignInFormValues` instead.
 * Initial values for the sign-in form.
 */
type SignInInitialValues = Partial<SignInFormValues>;
type SignInFormValues = {
  email?: string;
  password?: string;
  phoneNumber?: string;
};

/**
 * @deprecated
 */
export type SignInInitialValue = Partial<SignInFormValues>;


export type SignInPasswordParams = {
  email: string;
  password: string;
}

export type SignInPhoneParams = {
  phoneNumber: string;
}

export interface AuthErrorResponse {
  success: false
  message: string
  code: ErrorCode
}

export interface AuthErrorTree extends Error {
  code?: any | string;
  message: string;
  response?: any | string;
}

interface BaseSignInResponse {
  status?: SignInStatus;
  message?: string;
  error?: any | undefined;
}


export interface SignInSuccessResponse extends BaseSignInResponse, UserCredential {
  status: 'success';
}

export interface SignInErrorResponse extends BaseSignInResponse {
  status: 'error';
}

export interface SignInPendingResponse extends BaseSignInResponse {
  status: 'redirecting' | 'pending_social' | 'pending_email_password';
}

export type SignInResponse =
  | SignInSuccessResponse
  | SignInErrorResponse
  | SignInPendingResponse;



export interface ResendEmailVerification {
  isVerified?: boolean;
}


export function isSignInResponseTree(value: any): value is SignInResponse {
  return (
    typeof value === 'object' &&
    'success' in value &&
    typeof value.success === 'boolean'
  );
}

/**
 * social provider options that allow to specify custom parameters
 */
export interface SocialProviderOptions {
  /** Authentication mode - popup or redirect */
  mode?: 'popup' | 'redirect';
  /** Custom parameters specific to the provider (e.g., prompt, access_type, locale) */
  customParameters?: Record<string, string>;
  /** OAuth scopes to request from the provider */
  scopes?: string[];
}

export interface SignInResource {

  status: SignInStatus | null;
  /**
   * Create combine email and phone sign in method
   */
  create: (params: SignInCreateParams) => Promise<SignInResource>;

  authenticateWithPassword: (params: SignInPasswordParams) => Promise<SignInResponse>;

  authenticateWithPhoneNumber: (params: SignInPhoneParams) => Promise<SignInResponse>;

  authenticateWithSocialProvider: (provider: string, options: SocialProviderOptions) => Promise<SignInResponse>;

  completeMfaSignIn: (mfaToken: string, mfaContext?: any) => Promise<SignInResponse>;

  sendPasswordResetEmail: (email: string) => Promise<{ response: { email: string } } | null>;

  resendEmailVerification: () => Promise<ResendEmailVerification>;

  attemptFirstFactor: (params: AttemptFirstFactorParams) => Promise<SignInResource>;

  checkRedirectResult: () => Promise<SignInResponse | null>;
}


export type SignInCreateParams = (
  | {
    strategy: PasswordStrategy;
    password: string;
    identifier: string;
  } | {
    strategy:
    | PhoneCodeStrategy
    | EmailCodeStrategy
    | ResetPasswordEmailCodeStrategy
    | ResetPasswordPhoneCodeStrategy;
    identifier: string;
  }
)


export type AttemptFirstFactorParams =
  | EmailCodeAttempt
  | PhoneCodeAttempt
  | PasswordAttempt
  | ResetPasswordPhoneCodeAttempt
  | ResetPasswordEmailCodeAttempt;


export interface SignInJson extends TernSecureResourceJSON {
  object: 'sign_in';
  id: string;
  status: SignInStatus;
}