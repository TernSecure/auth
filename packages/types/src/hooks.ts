import { SignInResource } from "./signIn";
import { SignOut } from './auth'
import { TernSecureUser } from "./all";

export type UseAuthReturn = {
    userId: string | null | undefined
    isLoaded: boolean
    isValid: boolean
    isVerified: boolean
    isAuthenticated: boolean
    token: any | null
    email: string | null
    status: "loading" | "authenticated" | "unauthenticated" | "unverified"
    user?: TernSecureUser | null
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