import type { SignInResource, SignUpResource } from '@tern-secure/types';


export type VerificationStatus = 'unverified' | 'verified' | 'transferable' | 'failed' | 'expired';

export interface SignInStartEmailLinkFlowParams extends StartEmailLinkFlowParams {
  emailAddressId: string;
}

export interface StartEmailLinkFlowParams {
  redirectUrl: string;
}

export type CreateEmailLinkFlowReturn<Params, Resource> = {
  startEmailLinkFlow: (params: Params) => Promise<Resource>;
  cancelEmailLinkFlow: () => void;
};

type EmailLinkable = SignUpResource | SignInResource;
type UseEmailLinkSignInReturn = CreateEmailLinkFlowReturn<SignInStartEmailLinkFlowParams, SignInResource>;
type UseEmailLinkSignUpReturn = CreateEmailLinkFlowReturn<StartEmailLinkFlowParams, SignUpResource>;

