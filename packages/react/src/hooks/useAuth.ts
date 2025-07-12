"use client"
import { useCallback } from 'react'
import { useAssertWrappedByTernSecureAuthProvider } from './useAssertWrappedTernSecureProvider'
import { 
  DEFAULT_TERN_SECURE_STATE, 
  TernSecureState,
  SignOutOptions
} from '@tern-secure/types'
import { useAuthProviderCtx } from '../ctx/AuthProvider'
import { useIsoTernSecureAuthCtx } from '../ctx/IsomorphicTernSecureCtx'

type AuthState = TernSecureState & {
  signOut?: (options?: SignOutOptions) => Promise<void>
}


export const useAuth = (): AuthState => {
  useAssertWrappedByTernSecureAuthProvider('useAuth')
  
  const ctx  = useAuthProviderCtx()
  const instance = useIsoTernSecureAuthCtx()

  //const signOut = useCallback(handleSignOut(instance), [instance])

  if (!ctx.isLoaded) {
    console.warn('[useAuth] TernSecure is not loaded yet. Returning default state.')
    return {
      ...DEFAULT_TERN_SECURE_STATE,
      isLoaded: false,
      //signOut,
    }
  }
  
  return {
    userId: ctx.userId,
    isLoaded: ctx.isLoaded,
    error: ctx.error,
    isValid: ctx.isValid,
    isVerified: ctx.isVerified,
    isAuthenticated: ctx.isAuthenticated,
    token: ctx.token,
    email: ctx.email,
    status: ctx.status,
    user: ctx.user,
    //signOut
  }
}
