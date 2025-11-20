import type { TernSecureUser, UserCredential } from "./all";

export type UnverifiedField = 'email_address' | 'phone_number';

interface BaseSignUpResponse {
  status?: SignUpStatus;
  message?: string;
  error?: any;
  unverifiedFields?: UnverifiedField[];
}

export interface SignUpSuccessResponse extends BaseSignUpResponse, UserCredential {
  status: 'complete';
}

export interface SignUpErrorResponse extends BaseSignUpResponse {
  status: 'error';
}

export interface SignUpMissingRequirementsResponse extends BaseSignUpResponse, UserCredential {
  status: 'missing_requirements';
  unverifiedFields: UnverifiedField[];
}

export type SignUpResponse =
  | SignUpSuccessResponse
  | SignUpErrorResponse
  | SignUpMissingRequirementsResponse;

export type SignUpFormValues = {
  email: string;
  password: string;
};

export type SignUpInitialValue = Partial<SignUpFormValues>;

//export type SignUpCreateParams = {};

export interface SignUpResource {
  status: SignUpStatus | null;
  user: TernSecureUser | null;  
  unverifiedFields?: UnverifiedField[];
  message?: string;
  error?: any;
  withEmailAndPassword: (params: SignUpFormValues) => Promise<SignUpResource>;
  /**
   * @param provider - The identifier of the social provider (e.g., 'google', 'microsoft', 'github').
   * @param options - Optional configuration for the social sign-in flow.
   * @returns A promise that resolves with the sign-in response or void if redirecting.
   */
  withSocialProvider: (
    provider: string,
    options?: { mode?: 'popup' | 'redirect' },
  ) => Promise<SignUpResponse | void>;
  /**
   * Sends an email verification link to the user's email address.
   * @param options - Optional configuration for the verification email.
   * @returns A promise that resolves with the updated SignUpResource.
   */
  attemptEmailVerification: (options?: {
    url?: string;
    handleCodeInApp?: boolean;
  }) => Promise<SignUpResource>;
}

export type SignUpStatus = 'missing_requirements' | 'complete' | 'abandoned' | 'error';
