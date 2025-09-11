import type { TernSecureNextProps } from "../types";
import type { 
  TernSecureProviderProps, 
  IsoTernSecureAuthOptions
} from "@tern-secure/react";

// Helper type for the return value, as children are handled by the consuming component
type NextProviderProcessedProps = Omit<TernSecureProviderProps, 'children'>;

export const allNextProviderPropsWithEnv = (
  nextProps: Omit<TernSecureNextProps, 'children'>
): NextProviderProcessedProps => {
  const {
    signInUrl,
    signUpUrl,
    apiKey: propsApiKey,
    apiUrl: propsApiUrl,
    requiresVerification: propsRequiresVerification,
    isTernSecureDev: propsIsTernSecureDev,
    enableServiceWorker: propsEnableServiceWorker,
    loadingComponent: propsLoadingComponent,
    useEmulator: propsUseEmulator,
    ...baseProps 
  } = nextProps;

  const envConfig = {
    apiKey: process.env.NEXT_PUBLIC_TERN_API_KEY,
    apiUrl: process.env.TERNSECURE_API_URL || '',
    projectId: process.env.NEXT_PUBLIC_TERN_PROJECT_ID,
    customDomain: process.env.NEXT_PUBLIC_TERN_CUSTOM_DOMAIN,
    proxyUrl: process.env.NEXT_PUBLIC_TERN_PROXY_URL,
    environment: process.env.NEXT_PUBLIC_TERN_ENVIRONMENT,
    signInUrl: process.env.NEXT_PUBLIC_SIGN_IN_URL,
    signUpUrl: process.env.NEXT_PUBLIC_SIGN_UP_URL,
    persistence: process.env.NEXT_PUBLIC_TERN_PERSISTENCE as 'local' | 'session' | 'none',
    useEmulator: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR,
    projectIdAdmin: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  };

  const ternSecureConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    appName: process.env.NEXT_PUBLIC_FIREBASE_APP_NAME || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENTID,
    tenantId: process.env.NEXT_PUBLIC_FIREBASE_TENANT_ID || '',
  };

  // Merge config values: props take precedence over environment variables
  const finalApiKey = propsApiKey ?? envConfig.apiKey;
  const finalApiUrl = propsApiUrl ?? envConfig.apiUrl;
  const finalSignInUrl = signInUrl ?? envConfig.signInUrl;
  const finalSignUpUrl = signUpUrl ?? envConfig.signUpUrl;
  const finalPersistence = baseProps.persistence ?? envConfig.persistence;

  // Construct the result, ensuring it conforms to NextProviderProcessedProps
  // (Omit<TernSecureProviderProps, 'children'>)
  const result: NextProviderProcessedProps = {
    ...(baseProps as Omit<TernSecureProviderProps, 'children' | keyof IsoTernSecureAuthOptions | 'requiresVerification' | 'loadingComponent'>),

    // Set the Firebase configuration properties
    ternSecureConfig,
    
    // Set properties explicitly taken from TernSecureNextProps (props version)
    // These are part of the TernSecureProviderProps interface.
    requiresVerification: propsRequiresVerification,
    isTernSecureDev: propsIsTernSecureDev,
    enableServiceWorker: propsEnableServiceWorker,
    loadingComponent: propsLoadingComponent,

    //TernSecure: baseProps.Instance,
    initialState: baseProps.initialState,
    bypassApiKey: baseProps.bypassApiKey,
    signInUrl: finalSignInUrl,
    signUpUrl: finalSignUpUrl,
    mode: baseProps.mode,
    apiUrl: finalApiUrl,
    persistence: finalPersistence,
    useEmulator: propsUseEmulator
  };

  // Clean up undefined keys that might have resulted from spreading if not present in baseProps
  // and also not set by merged values (e.g. if env var is also undefined)
  Object.keys(result).forEach(key => {
    if (result[key as keyof NextProviderProcessedProps] === undefined) {
      delete result[key as keyof NextProviderProcessedProps];
    }
  });

  return result;
};