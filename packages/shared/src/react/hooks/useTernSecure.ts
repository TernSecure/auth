import type { TernSecureAuth, TernSecureInstanceTree } from '@tern-secure/types';

import {
  useAssertWrappedByTernSecureAuthProvider,
  useTernSecureAuthCtx,
} from '../ternSecureAuthProvider';
import {
  useAssertWrappedByTernSecureProvider,
  useTernSecureInstanceContext,
} from '../ternsecureProvider';

/**
 * @deprecated this was a previous version with cdn. now since in this package we dont use cdn, create a new hook that uuses TernSecureAuth and rename this to useTernSecure_Deprecated
 *
 */
export const useTernSecure_Deprecated = (): TernSecureInstanceTree => {
  /**
   * if no assertion is needed, you can use the following:
   *  const instance  = useTernSecureInstanceContext();
   *  if (!instance) {
   *      throw new Error('useTernSecure must be used within a TernSecureProvider');
   *  }
   *  return instance;
   */

  useAssertWrappedByTernSecureProvider('useTernSecure');
  return useTernSecureInstanceContext();
};


/**
 * New hook that uses TernSecureAuth
 */
export const useTernSecure = (): TernSecureAuth => {
  /**
   * if no assertion is needed, you can use the following:
   *  const instance  = useTernSecureInstanceContext();
   *  if (!instance) {
   *      throw new Error('useTernSecure must be used within a TernSecureProvider');
   *  }
   *  return instance;
   */

  useAssertWrappedByTernSecureAuthProvider('useTernSecure');
  return useTernSecureAuthCtx();
};
