import { 
    assertContextExists,
    TernSecureAuthCtx,
    useTernSecureAuthCtx
 } from "@tern-secure/shared/react"

import type {
    SignInResource,
    SignUpResource,
    TernSecureUser
} from "@tern-secure/types"


export function useAuthSignInCtx(): SignInResource | undefined | null {
    const ctx = useTernSecureAuthCtx();
    assertContextExists(ctx, TernSecureAuthCtx)
    return ctx.signIn;
}

export function useAuthSignUpCtx(): SignUpResource {
    const ctx = useTernSecureAuthCtx();
    assertContextExists(ctx, TernSecureAuthCtx)
    return ctx.signUp;
}

export function useAuthUser(): TernSecureUser | null {
    const ctx = useTernSecureAuthCtx();
    assertContextExists(ctx, TernSecureAuthCtx)
    return ctx.internalAuthState.user || null;
}

