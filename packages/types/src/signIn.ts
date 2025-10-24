import type { UserCredential } from "./all";
import type { ErrorCode} from "./errors";

export type SignInStatus =
  | 'idle'
  | 'pending_email_password'
  | 'pending_social'
  | 'pending_mfa'
  | 'redirecting'
  | 'success'
  | 'error';


export type SignInFormValues = {
  email: string;
  password: string;
  phoneNumber?: string;
};

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


export type SignInInitialValue = Partial<SignInFormValues>;


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
  /**
   * The current status of the sign-in process.
   */
  status: SignInStatus | null;
  /**
   * Signs in a user with their email and password.
   * @param params - The sign-in form values.
   * @returns A promise that resolves with the sign-in response.
   */
  withEmailAndPassword: (params: SignInFormValues) => Promise<SignInResponse>;
  /**
   * @param provider - The identifier of the social provider (e.g., 'google', 'microsoft', 'github').
   * @param options - Optional configuration for the social sign-in flow.
   * @returns A promise that resolves with the sign-in response.
   */
  withSocialProvider: (provider: string, options: SocialProviderOptions) => Promise<SignInResponse>;
  /**
   * Completes an MFA (Multi-Factor Authentication) step after a primary authentication attempt.
   * @param mfaToken - The MFA token or code submitted by the user.
   * @param mfaContext - Optional context or session data from the MFA initiation step.
   * @returns A promise that resolves with the sign-in response upon successful MFA verification.
   */
  completeMfaSignIn: (mfaToken: string, mfaContext?: any) => Promise<SignInResponse>;
  /**
   * Sends a password reset email to the given email address.
   * @param email - The user's email address.
   * @returns A promise that resolves when the email is sent.
   */
  sendPasswordResetEmail: (email: string) => Promise<void>;
  /**
   * Resends the email verification link to the user's email address.
   * @returns A promise that resolves with the sign-in response.
   */
  resendEmailVerification: () => Promise<ResendEmailVerification>;
  /**
   * Checks the result of a redirect-based sign-in flow, typically used in OAuth or SSO scenarios.
   * @returns A promise that resolves with the sign-in response or null if no result is available.
   */
  checkRedirectResult: () => Promise<SignInResponse| null>;
}