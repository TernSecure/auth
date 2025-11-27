import type { AuthObject } from '@tern-secure/backend';
import { AuthStatus, signedInAuthObject, signedOutAuthObject } from '@tern-secure/backend';
import { ternDecodeJwt } from '@tern-secure/backend/jwt';
import type { ParsedToken, TernSecureConfig, TernSecureUser } from '@tern-secure/types';
import type { FirebaseServerApp } from "firebase/app";
import { initializeServerApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import { getAuth } from "firebase/auth";

import { getAuthKeyFromRequest, getHeader } from '../../server/headers-utils';
import type { RequestLike } from '../../server/types';
import {
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_MEASUREMENT_ID,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET
} from "../constant";


/**
 * Auth objects moving through the server -> client boundary need to be serializable
 * as we need to ensure that they can be transferred via the network as pure strings.
 * Some frameworks like Remix or Next (/pages dir only) handle this serialization by simply
 * ignoring any non-serializable keys, however Nextjs /app directory is stricter and
 * throws an error if a non-serializable value is found.
 * @internal
 */
export const authObjectToSerializableJwt = <T extends Record<string, unknown>>(obj: T): T => {
  // remove any non-serializable props from the returned object

  const { require, ...rest } = obj as unknown as AuthObject;
  return rest as unknown as T;
};

export function getTernSecureAuthDataJwt(req: RequestLike, initialState = {}) {
  const authObject = getAuthDataFromRequestJwt(req);
  return authObjectToSerializable({ ...initialState, ...authObject });
}

export function getAuthDataFromRequestJwt(req: RequestLike): AuthObject {
  const authStatus = getAuthKeyFromRequest(req, 'AuthStatus');
  const authToken = getAuthKeyFromRequest(req, 'AuthToken');
  const authSignature = getAuthKeyFromRequest(req, 'AuthSignature');
  const authReason = getAuthKeyFromRequest(req, 'AuthReason');

  let authObject;
  if (!authStatus || authStatus !== AuthStatus.SignedIn) {
    authObject = signedOutAuthObject();
  } else {
    const jwt = ternDecodeJwt(authToken as string);

    authObject = signedInAuthObject(jwt.raw.text, jwt.payload);
  }
  return authObject;
}


export type SerializableTernSecureUser = Omit<TernSecureUser, 'delete' | 'getIdToken' | 'getIdTokenResult' | 'reload' | 'toJSON'>;

export type Aobj = {
  user: SerializableTernSecureUser | null
  userId: string | null
}


// Serializable auth object type
/**
 * Auth objects moving through the server -> client boundary need to be serializable
 * as we need to ensure that they can be transferred via the network as pure strings.
 * Some frameworks like Remix or Next (/pages dir only) handle this serialization by simply
 * ignoring any non-serializable keys, however Nextjs /app directory is stricter and
 * throws an error if a non-serializable value is found.
 * @internal
 */
export const authObjectToSerializable = <T extends Record<string, unknown>>(
  obj: T
): T => {
  // remove any non-serializable props from the returned object

  const { require, ...rest } = obj as unknown as AuthObject;
  return rest as unknown as T;
};

export async function getTernSecureAuthData(
  req: RequestLike,
  initialState = {}
) {
  const authObject = await getAuthDataFromRequest(req);
  return authObjectToSerializable({ ...initialState, ...authObject });
}

export async function getAuthDataFromRequest(req: RequestLike): Promise<AuthObject & Aobj> {
  const authStatus = getAuthKeyFromRequest(req, "AuthStatus");
  const authToken = getAuthKeyFromRequest(req, "AuthToken");
  const appCheckToken = getHeader(req, "X-Firebase-AppCheck");

  if (!authStatus || authStatus !== AuthStatus.SignedIn) {
    return {
      ...signedOutAuthObject(),
      user: null,
      userId: null
    }
  }

  const firebaseUser = await authenticateRequest(
    authToken as string, 
    req as any, 
    appCheckToken as string | undefined
  );
  if (!firebaseUser || !firebaseUser.claims) {
    return {
      ...signedOutAuthObject(),
      user: null,
      userId: null
    }
  }
  const { user, claims } = firebaseUser;
  const authObject = signedInAuthObject(authToken as string, claims as any);
  return {
    ...authObject,
    user: user || null,
  };
}

const authenticateRequest = async (
  token: string,
  request: Request,
  appCheckToken?: string
): Promise<{ user: SerializableTernSecureUser; claims: ParsedToken } | null> => {
  try {
    //console.log("[getAuthDataFromRequest] App Check Token:", appCheckToken);
    const origin = new URL(request.url).origin;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("referer", origin);
    requestHeaders.set("Referer", origin);

    const mockRequest = {
      headers: requestHeaders,
    };

    const config: TernSecureConfig = {
      apiKey: FIREBASE_API_KEY,
      authDomain: FIREBASE_AUTH_DOMAIN,
      projectId: FIREBASE_PROJECT_ID,
      storageBucket: FIREBASE_STORAGE_BUCKET,
      messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
      appId: FIREBASE_APP_ID,
      measurementId: FIREBASE_MEASUREMENT_ID,
    };

    const firebaseServerApp: FirebaseServerApp = initializeServerApp(
      config,
      {
        authIdToken: token,
        appCheckToken: appCheckToken,
        releaseOnDeref: mockRequest,
      }
    );

    const auth: Auth = getAuth(firebaseServerApp);
    await auth.authStateReady();

    if (auth.currentUser) {
      const idTokenResult = await auth.currentUser.getIdTokenResult();
      const claims = idTokenResult.claims;

      const userObj: SerializableTernSecureUser = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        emailVerified: auth.currentUser.emailVerified,
        displayName: auth.currentUser.displayName,
        isAnonymous: auth.currentUser.isAnonymous,
        phoneNumber: auth.currentUser.phoneNumber,
        photoURL: auth.currentUser.photoURL,
        providerId: auth.currentUser.providerId,
        tenantId: auth.currentUser.tenantId,
        refreshToken: auth.currentUser.refreshToken,
        metadata: {
          creationTime: auth.currentUser.metadata.creationTime,
          lastSignInTime: auth.currentUser.metadata.lastSignInTime,
        },
        providerData: auth.currentUser.providerData.map((provider) => ({
          uid: provider.uid,
          displayName: provider.displayName,
          email: provider.email,
          phoneNumber: provider.phoneNumber,
          photoURL: provider.photoURL,
          providerId: provider.providerId,
        })),
      };

      return { user: userObj, claims };
    }

    return null;
  } catch (error) {
    return null;
  }
};

export { TernSecureUser }
