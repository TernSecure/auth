
//import { TernSecureServerProvider } from './app-router/server/TernSecureServerProvider'
//import type { TernSecureState } from './app-router/client/TernSecureProvider'
//export { 
//    TernSecureAuth, 
//    TernSecureFirestore, 
//    ternSecureAuth 
//} from '@tern-secure/react'
//export { loadFireConfig, validateConfig } from './utils/config'
//export { signInWithEmail } from '@tern-secure/next-backend'
//export { useInternalContext } from './boundary/TernSecureCtx'
//export { TernSecureClientProvider } from './app-router/client/TernSecureProvider'
export { TernSecureProvider } from './app-router/client/TernSecureProvider'
export {
    useAuth,
    useIdToken,
    useSignUp,
    useSession,
    useSignIn,
    signIn
    //SignIn,
    //SignOut,
    //SignOutButton,
    //SignUp,
} from './boundary/components'

export type { TernSecureUser, TernSecureUserData, SignInResponseTree } from '@tern-secure/types'

//export const TernSecureProvider = TernSecureServerProvider
export type {
    UserInfo,
    SessionResult
} from './types'