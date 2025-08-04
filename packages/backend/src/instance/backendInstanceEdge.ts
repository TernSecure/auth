import {
  TernSecureRequest,
  createTernSecureRequest,
} from "./ternSecureRequest";
import type {
  CheckCustomClaims,
  DecodedIdToken,
  TernVerificationResult,
} from "@tern-secure/types";
import { verifyToken } from "../jwt";
import { getDisabledUser, type DisabledUserRecord } from "../utils/redis";
import { authLogger } from "../utils/logger";

export type SignInAuthObject = {
  session: DecodedIdToken;
  userId: string;
  has: CheckCustomClaims;
  error: string | null;
};

export type SignedOutAuthObject = {
  session: null;
  userId: null;
  has: CheckCustomClaims;
  error: string | null;
};

export type SignedInState = {
  isSignedIn: true;
  auth: () => SignInAuthObject;
  token: string;
  headers: Headers;
};

export type SignedOutState = {
  isSignedIn: false;
  auth: () => SignedOutAuthObject;
  token: null;
  headers: Headers;
};

export type RequestState = SignedInState | SignedOutState;

export interface BackendInstance {
  ternSecureRequest: TernSecureRequest;
  requestState: RequestState;
}

export type AuthObject = SignInAuthObject | SignedOutAuthObject;

async function verifySessionCookieEdge(
  sessionToken: string
): Promise<TernVerificationResult> {
  try {
    const result = await verifyToken(sessionToken, true);
    return result;
  } catch (error) {
    authLogger.error("Edge verification error:", error);
    return {
      valid: false,
      error: {
        success: false,
        message:
          error instanceof Error ? error.message : "Edge verification failed",
        code: "INVALID_TOKEN",
      },
    };
  }
}

export const createBackendInstanceEdge = async (
  request: Request,
  checkRevoked: boolean = false
): Promise<BackendInstance> => {
  const ternSecureRequest = createTernSecureRequest(request);
  const requestState = await authenticateRequestEdge(
    ternSecureRequest,
    checkRevoked
  );

  return {
    ternSecureRequest,
    requestState,
  };
};

export async function authenticateRequestEdge(
  request: Request,
  checkRevoked: boolean = false
): Promise<RequestState> {

  const sessionCookie = request.headers.get("cookie");
  const sessionToken = sessionCookie
    ?.split(";")
    .find((c) => c.trim().startsWith("_session_cookie="))
    ?.split("=")[1];

  if (!sessionToken) {
    return createUnauthenticatedState(
      new Headers(request.headers),
      "No session token found"
    );
  }

  const verificationResult = await verifySessionCookieEdge(sessionToken);

  if (!verificationResult.valid) {
    const errorMessage =
      verificationResult.error?.message || "Invalid session token";
    authLogger.debug("Token verification failed", { errorMessage });
    return createUnauthenticatedState(
      new Headers(request.headers),
      errorMessage
    );
  }


  if (checkRevoked) {
    const disabledUser: DisabledUserRecord | null = await getDisabledUser(verificationResult.uid);
    const isDisabled = !!disabledUser;

    if (isDisabled) {
      return createUnauthenticatedState(
        new Headers(request.headers),
        "User account has been disabled"
      );
    }
  }

  const decodedToken: DecodedIdToken = {
    aud: verificationResult.aud,
    auth_time: verificationResult.auth_time,
    email: verificationResult.email || undefined,
    email_verified: verificationResult.email_verified,
    exp: verificationResult.exp,
    firebase: verificationResult.firebase || {
      identities: {},
      sign_in_provider: "custom",
      tenant: "default",
    },
    iat: verificationResult.iat,
    iss: verificationResult.iss,
    phone_number: verificationResult.phone_number,
    picture: verificationResult.picture,
    sub: verificationResult.sub,
    uid: verificationResult.uid,
  };

  return signedIn(decodedToken, new Headers(request.headers), sessionToken);
}

export function signInAuthObject(session: DecodedIdToken): SignInAuthObject {
  return {
    session: {
      ...session,
      email: session.email || undefined,
      firebase: session.firebase || {
        identities: {},
        sign_in_provider: "custom",
        tenant: "default",
      },
    },
    userId: session.uid,
    has: {} as CheckCustomClaims,
    error: null,
  };
}

export function signedIn(
  session: DecodedIdToken,
  headers: Headers = new Headers(),
  token: string
): SignedInState {
  const authObject = signInAuthObject(session);
  return {
    isSignedIn: true,
    auth: () => authObject,
    token,
    headers,
  };
}

const createUnauthenticatedState = (
  headers: Headers,
  error: string
): RequestState => ({
  auth: () => ({
    session: null,
    userId: null,
    has: {} as CheckCustomClaims,
    error,
  }),
  token: null,
  headers,
  isSignedIn: false,
});
