import type { RequestState } from "./authstate";
import { signedIn } from "./authstate";
import type {
  CheckAuthorizationFromSessionClaims,
  DecodedIdToken,
  TernVerificationResult,
} from "@tern-secure/types";
import { verifyToken  } from "../jwt";
import { verifyTokenV } from "./verify";
import { type DisabledUserRecord } from "../utils/redis";
import { authLogger } from "../utils/logger";
import {
  createAdapter,
  type DisabledUserAdapter,
  type CheckRevokedOptions,
  validateCheckRevokedOptions,
} from "../adapters";



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

export async function authenticateRequestEdge(
  request: Request,
  checkRevoked?: CheckRevokedOptions
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
    const headersWithDeletedCookie = deleteSessionCookie(
      new Headers(request.headers)
    );
    return createUnauthenticatedState(headersWithDeletedCookie, errorMessage);
  }

  if (checkRevoked?.enabled) {
    const validation = validateCheckRevokedOptions(checkRevoked);
    if (!validation.isValid) {
      authLogger.error("Invalid checkRevoked configuration:", validation.error);
      return createUnauthenticatedState(
        new Headers(request.headers),
        validation.error || "Invalid checkRevoked configuration"
      );
    }

    let disabledUser: DisabledUserRecord | null = null;

    if (checkRevoked.adapter) {
      const adapter: DisabledUserAdapter = createAdapter(checkRevoked.adapter);
      disabledUser = await adapter.getDisabledUser(verificationResult.uid);
    }

    const isDisabled = !!disabledUser;

    if (isDisabled) {
      const headersWithDeletedCookie = deleteSessionCookie(
        new Headers(request.headers)
      );
      return createUnauthenticatedState(
        headersWithDeletedCookie,
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
    firebase: verificationResult.firebase
      ? {
          identities: verificationResult.firebase.identities || {},
          sign_in_provider:
            verificationResult.firebase.sign_in_provider || "custom",
          sign_in_second_factor:
            verificationResult.firebase.sign_in_second_factor || "custom",
          second_factor_identifier:
            verificationResult.firebase.second_factor_identifier || "custom",
          tenant: verificationResult.firebase.tenant || "default",
          keys: verificationResult.firebase.keys || {},
        }
      : {
          identities: {},
          sign_in_provider: "custom",
          sign_in_second_factor: "custom",
          second_factor_identifier: "custom",
          tenant: "default",
          keys: {},
        },
    iat: verificationResult.iat,
    iss: verificationResult.iss,
    phone_number: verificationResult.phone_number,
    picture: verificationResult.picture,
    sub: verificationResult.sub,
    uid: verificationResult.uid,
    key: verificationResult.key || null,
  };

  return signedIn(decodedToken, undefined, sessionToken);
}


const createUnauthenticatedState = (
  headers: Headers,
  error: string
): RequestState => ({
  status: "signed-out",
  auth: () => ({
    session: null,
    userId: null,
    has: {} as CheckAuthorizationFromSessionClaims,
    error,
  }),
  token: null,
  headers,
  isSignedIn: false,
});

const COOKIE_DELETE_VALUE =
  "_session_cookie=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict; Max-Age=0";

/**
 * Deletes the session cookie by setting it to expire immediately
 * @param headers - Headers object to modify
 * @returns Modified headers with cookie deletion directive
 */
const deleteSessionCookie = (headers: Headers): Headers => {
  const modifiedHeaders = new Headers(headers);
  modifiedHeaders.set("Set-Cookie", COOKIE_DELETE_VALUE);
  return modifiedHeaders;
};


