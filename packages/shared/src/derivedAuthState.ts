import type {
  DecodedIdToken,
  SignedInSession,
  TernSecureInitialState,
  TernSecureResources,
  TernSecureUser,
} from '@tern-secure/types';


type NormalizedClaims = DecodedIdToken;


type DerivedAuthState = {
  userId: string | null | undefined;
  user: TernSecureUser | null | undefined;
  sessionClaims: NormalizedClaims | null | undefined;
  token?: string | null;
  session?: SignedInSession | null;
};

export const deriveAuthState = (
  authState: TernSecureResources,
  initialState: TernSecureInitialState | undefined,
): DerivedAuthState => {
  if (!authState.user && initialState) {
    return fromSsrInitialState(initialState);
  }
  return fromClientSideState(authState);
};

const fromSsrInitialState = (initialState: TernSecureInitialState) => {
  const userId = initialState.userId;
  const sessionClaims = initialState.sessionClaims;
  const token = initialState.token;
  const user = initialState.user as TernSecureUser;

  return {
    userId,
    sessionClaims,
    token,
    user,
    session: undefined,
  };
};


const fromClientSideState = (authState: TernSecureResources) => {
  const userId: string | null | undefined = authState.user ? authState.user.uid : null;
  const user = authState.user;
  const sessionClaims: DecodedIdToken | null = authState.session?.claims ? {
    uid: userId || (authState.session.claims.sub as string) || '',
    sub: (authState.session.claims.sub as string) || userId || '',
    email: (authState.session.claims as any).email || authState.user?.email || undefined,
    email_verified: (authState.session.claims as any).email_verified || authState.user?.emailVerified || false,
    exp: authState.session.claims.exp ? parseInt(authState.session.claims.exp) : 0,
    iat: authState.session.claims.iat ? parseInt(authState.session.claims.iat) : 0,
    auth_time: authState.session.claims.auth_time ? parseInt(authState.session.claims.auth_time) : 0,
    aud: (authState.session.claims as any).aud || '',
    iss: (authState.session.claims as any).iss || '',
    firebase: {
      identities: (authState.session.claims.firebase?.identities || {}) as { [key: string]: unknown },
      sign_in_provider: authState.session.claims.firebase?.sign_in_provider || authState.session.signInProvider || 'unknown',
      sign_in_second_factor: authState.session.claims.firebase?.sign_in_second_factor,
    },
    phone_number: user?.phoneNumber || undefined,
    picture: user?.photoURL || undefined,
    name: user?.displayName || undefined,
  } as DecodedIdToken : null;

  return {
    userId,
    sessionClaims,
    user,
  };
};
