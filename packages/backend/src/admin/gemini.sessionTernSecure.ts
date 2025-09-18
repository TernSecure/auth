"use server";

import { handleFirebaseAuthError } from "@tern-secure/shared/errors";
import type {
  CookieStore,
  SessionParams,
  SessionResult,
} from "@tern-secure/types";

import { getCookieOptions, getSessionConfig } from "../tokens/sessionConfig";
import type { RequestOptions } from "../tokens/types";
import {  getAuthForTenant } from "../utils/admin-init";

export async function createSessionCookie(
  params: SessionParams | string,
  cookieStore: CookieStore,
  options?: RequestOptions & { cookies?: any }
): Promise<SessionResult> {
  try {
    const tenantAuth = getAuthForTenant(options?.tenantId);

    getSessionConfig(options);
    getCookieOptions(options);
    
    let decodedToken;
    let sessionCookie;

    const idToken = typeof params === "string" ? params : params.idToken;

    if (!idToken) {
      const error = new Error("ID token is required for session creation");
      console.error("[createSessionCookie] Missing ID token:", error);
      return {
        success: false,
        message: "ID token is required",
        error: "INVALID_TOKEN",
        cookieSet: false,
      };
    }

    try {
      decodedToken = await tenantAuth.verifyIdToken(idToken);
    } catch (verifyError) {
      console.error(
        "[createSessionCookie] ID token verification failed:",
        verifyError
      );
      const authError = handleFirebaseAuthError(verifyError);
      return {
        success: false,
        message: authError.message,
        error: authError.code,
        cookieSet: false,
      };
    }

    if (!decodedToken) {
      const error = new Error("Invalid ID token - verification returned null");
      console.error(
        "[createSessionCookie] Token verification returned null:",
        error
      );
      return {
        success: false,
        message: "Invalid ID token",
        error: "INVALID_TOKEN",
        cookieSet: false,
      };
    }

    const maxAgeSeconds = options?.cookies?.maxAge ?? 5 * 24 * 60 * 60; // Default 5 days
    const expiresInMs = maxAgeSeconds * 1000;

    try {
      sessionCookie = await tenantAuth.createSessionCookie(idToken, {
        expiresIn: expiresInMs,
      });
    } catch (sessionError) {
      console.error(
        "[createSessionCookie] Firebase session cookie creation failed:",
        sessionError
      );
      const authError = handleFirebaseAuthError(sessionError);
      return {
        success: false,
        message: authError.message,
        error: authError.code,
        cookieSet: false,
      };
    }

    // Set the cookie
    try {
      const cookieName = options?.cookies?.session_cookie?.name ?? '_session_cookie';

      const setCookieOptions: { [key: string]: any } = {
        domain: options?.cookies?.session_cookie?.attributes?.domain,
        path: options?.cookies?.session_cookie?.attributes?.path ?? '/',
        httpOnly: options?.cookies?.session_cookie?.attributes?.httpOnly ?? true,
        sameSite: options?.cookies?.session_cookie?.attributes?.sameSite ?? 'lax',
        maxAge: maxAgeSeconds,
      };

      if (process.env.NODE_ENV === 'production') {
        setCookieOptions.secure = true;
      }

      cookieStore.set(cookieName, sessionCookie, setCookieOptions);
    } catch (cookieError) {
      console.error(
        "[createSessionCookie] Failed to set session cookie:",
        cookieError
      );
      return {
        success: false,
        message: "Failed to set session cookie",
        error: "COOKIE_SET_FAILED",
        cookieSet: false,
      };
    }

    console.log(
      `[createSessionCookie] Session cookie created successfully for user: ${decodedToken.uid}`
    );
    return {
      success: true,
      message: "Session created successfully",
      expiresIn: maxAgeSeconds,
      cookieSet: true,
    };
  } catch (error) {
    console.error("[createSessionCookie] Unexpected error:", error);
    const authError = handleFirebaseAuthError(error);
    return {
      success: false,
      message: authError.message || "Failed to create session",
      error: authError.code || "INTERNAL_ERROR",
      cookieSet: false,
    };
  }
}

export async function clearSessionCookie(
  cookieStore: CookieStore,
  options?: RequestOptions
): Promise<SessionResult> {
  try {
    const adminAuth = getAuthForTenant(options?.tenantId);
    const sessionConfig = getSessionConfig(options);
    const cookieName = options?.cookies?.session_cookie?.name ?? '_session_cookie';

    const sessionCookie = await cookieStore.get(cookieName);

    await cookieStore.delete(cookieName);
    await cookieStore.delete("_session_token");
    await cookieStore.delete("_session");

    if (
      sessionConfig.REVOKE_REFRESH_TOKENS_ON_SIGNOUT &&
      sessionCookie?.value
    ) {
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(
          sessionCookie.value
        );
        await adminAuth.revokeRefreshTokens(decodedClaims.sub);
        console.log(
          `[clearSessionCookie] Successfully revoked tokens for user: ${decodedClaims.sub}`
        );
      } catch (revokeError) {
        console.error(
          "[clearSessionCookie] Failed to revoke refresh tokens:",
          revokeError
        );
      }
    }

    console.log("[clearSessionCookie] Session cookies cleared successfully");
    return {
      success: true,
      message: "Session cleared successfully",
      cookieSet: false,
    };
  } catch (error) {
    console.error("[clearSessionCookie] Unexpected error:", error);
    const authError = handleFirebaseAuthError(error);
    return {
      success: false,
      message: authError.message || "Failed to clear session",
      error: authError.code || "INTERNAL_ERROR",
      cookieSet: false,
    };
  }
}

export async function createCustomToken(uid: string, options?: RequestOptions): Promise<string | null> {
  const adminAuth = getAuthForTenant(options?.tenantId);
  try {
    const customToken = await adminAuth.createCustomToken(uid);
    return customToken;
  } catch (error) {
    console.error("[createCustomToken] Error creating custom token:", error);
    return null;
  }
}
