export { useAuth, useDeriveAuth} from './hooks/useAuth';
export { useIdToken } from './hooks/useIdToken';
export { useSession } from './hooks/useSession';
export { useSignIn, signIn } from './hooks/useSignIn';
export { useSignUp } from './hooks/useSignUp';
export { TernSecureCtxProvider } from './ctx/TernSecureCtxProvider';
export { TernSecureProvider } from './ctx/TernSecureProvider';

export {
  isAuthRoute,
  isBaseAuthRoute,
  isInternalRoute,
  handleInternalRoute,
} from './route-handler/internal-route';

export type {
  IsoTernSecureAuthOptions,
  Browser,
  TernSecureProviderProps,
} from './types';

export {
    SignIn,
    SignUp,
    UserButton
} from './components/uiComponent'

export {
    loadTernUIScript,
    ternUIgetScriptUrl,
    constructScriptAttributes,
    constructTernUIScriptAttributes
} from '@tern-secure/shared/loadTernUIScript'

