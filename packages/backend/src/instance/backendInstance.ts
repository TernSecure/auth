import { TernSecureRequest, createTernSecureRequest } from "./ternSecureRequest";
import type { CheckCustomClaims, SharedSignInAuthObjectProperties, DecodedIdToken } from "@tern-secure/types";
import { VerifyNextTernSessionCookie } from "../admin/nextSessionTernSecure";

export type SignInAuthObject = SharedSignInAuthObjectProperties & {
  has: CheckCustomClaims
}

export type SignInState = {
  auth: () => SignInAuthObject
  token: string
  headers: Headers
}

export type RequestState = SignInState

export interface BackendInstance {
  ternSecureRequest: TernSecureRequest;
  requestState: RequestState;
}

export const createBackendInstance = async (request: Request): Promise<BackendInstance> => {
  const ternSecureRequest = createTernSecureRequest(request);
  const requestState = await authenticateRequest(request);
  
  return {
    ternSecureRequest,
    requestState,
  };
};

export async function authenticateRequest(request: Request): Promise<RequestState> {
  const sessionCookie = request.headers.get('cookie');
  const sessionToken = sessionCookie?.split(';')
    .find(c => c.trim().startsWith('_session_cookie='))
    ?.split('=')[1];
  
  if (!sessionToken) {
    throw new Error("No session token found");
  }

  const verificationResult = await VerifyNextTernSessionCookie(sessionToken);

  if (!verificationResult.valid) {
    throw new Error("Invalid session token");
  }

  return signedIn(
    verificationResult as DecodedIdToken,
    new Headers(request.headers),
    sessionToken
  );
}

export function signInAuthObject(
  session: DecodedIdToken,
): SignInAuthObject {
  return {
    session,
    userId: session.uid,
    has: {} as CheckCustomClaims,
  };
}

export function signedIn(
  session: DecodedIdToken,
  headers: Headers = new Headers(),
  token: string
): SignInState {
  const authObject = signInAuthObject(session);
  return {
    auth: () => authObject,
    token,
    headers,
  };
}
