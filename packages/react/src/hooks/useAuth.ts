"use client"
import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAssertWrappedByTernSecureAuthProvider } from './useAssertWrappedTernSecureProvider'
import { 
  SignOut,
  SignOutOptions,
  UseAuthReturn
} from '@tern-secure/types'
import { useAuthProviderCtx } from '../ctx/AuthProvider'
import { useIsoTernSecureAuthCtx } from '../ctx/IsomorphicTernSecureCtx'
import { IsoTernSecureAuth } from '../lib/isoTernSecureAuth'



const handleSignOut = (instance: IsoTernSecureAuth) => {
  return async (options?: SignOutOptions) => {
    try {
      if (options?.onBeforeSignOut) {
        await options.onBeforeSignOut();
      }

      await instance.signOut(options);

      if (options?.onAfterSignOut) {
        await options.onAfterSignOut();
      }
    } catch (error) {
      console.error('[useAuth] Sign out failed:', error)
      throw error
    }
  }
}


export const useAuth = (): UseAuthReturn => {
  useAssertWrappedByTernSecureAuthProvider('useAuth')
  
  const ctx  = useAuthProviderCtx()
  let authCtx = ctx

  if (authCtx.userId === null) {
    console.warn('[useAuth] TernSecureAuth context is not initialized. Returning default state.')
  }

  const instance = useIsoTernSecureAuthCtx()
  const signOut: SignOut = useCallback(handleSignOut(instance), [instance])

  const isLoaded = !!ctx.user || ctx.userId !== undefined
  const isValid = !!ctx.userId
  const isVerified = !!ctx.user?.emailVerified
  const isAuthenticated = isValid && isVerified
  const status = deriveAuthStatus(isLoaded, isAuthenticated, isVerified)

  return {
    userId: ctx.userId,
    email: ctx.email,
    token: ctx.token,
    user: ctx.user,
    isLoaded,
    isValid,
    isVerified,
    isAuthenticated,
    status,
    signOut
  }
}


const deriveAuthStatus = (
  isLoaded: boolean, 
  isAuthenticated: boolean,
  isVerified: boolean
): UseAuthReturn['status'] => {
  if (!isLoaded) return 'loading'
  if (!isAuthenticated) return 'unauthenticated'
  if (!isVerified) return 'unverified'
  return 'authenticated'
}
