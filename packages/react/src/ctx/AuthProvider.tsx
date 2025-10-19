import { createContextAndHook } from "@tern-secure/shared/react";
import type { DecodedIdToken,TernSecureUser } from "@tern-secure/types";

export type AuthProviderCtxValue = {
  userId: string | null | undefined;
  sessionClaims: DecodedIdToken | null | undefined;
  user: TernSecureUser | null | undefined;
};

export const [AuthProviderCtx, useAuthProviderCtx] =
  createContextAndHook<AuthProviderCtxValue>("AuthProviderCtx");
