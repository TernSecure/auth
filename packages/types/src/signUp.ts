import type { UserCredential } from "./all";

interface BaseSignUpResponse {
  status?: SignUpStatus;
  message?: string;
  error?: any | undefined;
}

export interface SignUpSuccessResponse extends BaseSignUpResponse, UserCredential {
  status: 'complete';
}

export interface SignUpErrorResponse extends BaseSignUpResponse {
  status: 'error';
}

export type SignUpResponse =
  | SignUpSuccessResponse
  | SignUpErrorResponse;

export type SignUpFormValues = {
  email: string;
  password: string;
};

export type SignUpInitialValue = Partial<SignUpFormValues>;

//export type SignUpCreateParams = {};

export interface SignUpResource {
  status: SignUpStatus | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  withEmailAndPassword: (params: SignUpInitialValue) => Promise<SignUpResponse>;
  /**
   * @param provider - The identifier of the social provider (e.g., 'google', 'microsoft', 'github').
   * @param options - Optional configuration for the social sign-in flow.
   * @returns A promise that resolves with the sign-in response or void if redirecting.
   */
  withSocialProvider: (
    provider: string,
    options?: { mode?: 'popup' | 'redirect' },
  ) => Promise<SignUpResponse | void>;
}

export type SignUpStatus = 'missing_requirements' | 'complete' | 'abandoned' | 'error';
