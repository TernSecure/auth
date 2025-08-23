import { createContextAndHook } from "@tern-secure/shared/react";
import { TernSecureUser } from "@tern-secure/types";

export type AuthProviderCtxValue = {
  userId: string | null | undefined;
  token: any | null;
  email: string | null;
  user?: TernSecureUser | null;
};

export const [AuthProviderCtx, useAuthProviderCtx] =
  createContextAndHook<AuthProviderCtxValue>("AuthProviderCtx");
