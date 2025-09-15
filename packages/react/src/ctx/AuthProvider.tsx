import { createContextAndHook } from "@tern-secure/shared/react";
import type { TernSecureUser } from "@tern-secure/types";

export type AuthProviderCtxValue = {
  userId: string | null | undefined;
  token: string | null;
  email: string | null;
  user?: TernSecureUser | null;
};

export const [AuthProviderCtx, useAuthProviderCtx] =
  createContextAndHook<AuthProviderCtxValue>("AuthProviderCtx");
