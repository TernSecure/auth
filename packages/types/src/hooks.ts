import type { TernSecureUser } from "./all";
import type { SignOut } from './auth'
import type { DecodedIdToken } from './jwt';
import type { SignInResource } from "./signIn";

export type UseAuthReturn = {
    userId: string | null | undefined
    isLoaded: boolean
    isValid: boolean
    isVerified: boolean
    isAuthenticated: boolean
    status: "loading" | "authenticated" | "unauthenticated" | "unverified"
    user?: TernSecureUser | null
    sessionClaims?: DecodedIdToken | null | undefined
    signOut: SignOut
}

export type UseSignInReturn = 
| {
    isLoaded: false; 
    signIn: undefined;
} 
| {
    isLoaded: true; 
    signIn: SignInResource;
}