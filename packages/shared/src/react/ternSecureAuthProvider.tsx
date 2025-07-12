'use client'

import { useContext } from 'react';
import type { 
  TernSecureAuth,
} from '@tern-secure/types';
import { createContextAndHook } from './ternsecureCtx';


const [TernSecureAuthCtx, useTernSecureAuthCtx] =
  createContextAndHook<TernSecureAuth>('TernSecureAuthCtx');

function useAssertWrappedByTernSecureAuthProvider(displayNameOrFn: string | (() => void)): void {
  //const ctx = useTernSecureInstanceContext();
  const ctx = useContext(TernSecureAuthCtx);
  
  if (!ctx) {
    if (typeof displayNameOrFn === 'function') {
      displayNameOrFn();
      return;
    }

    throw new Error(
      `${displayNameOrFn} can only be used within the <TernSecureProvider /> component.
      
Possible fixes:
1. Ensure that the <TernSecureProvider /> is correctly wrapping your application
2. Check for multiple versions of @tern-secure packages in your project`
    );
  }
}



export {
  TernSecureAuthCtx,
  useTernSecureAuthCtx,
  useAssertWrappedByTernSecureAuthProvider,
};