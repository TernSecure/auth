"use server";

import { handleFirebaseAuthError } from "@tern-secure/shared/errors";
import type { TernVerificationResult } from "@tern-secure/types";
import { cookies } from "next/headers";

import { constants } from '../constants';
import { adminTernSecureAuth as adminAuth, getAuthForTenant } from "../utils/admin-init";


const SESSION_CONSTANTS = {
  COOKIE_NAME: constants.Cookies.Session,
  DEFAULT_EXPIRES_IN_MS: 60 * 60 * 24 * 5 * 1000, // 5 days
  DEFAULT_EXPIRES_IN_SECONDS: 60 * 60 * 24 * 5,
  REVOKE_REFRESH_TOKENS_ON_SIGNOUT: true,
} as const;

export async function CreateNextSessionCookie(idToken: string) {
  try {
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const cookieStore = await cookies();
    cookieStore.set(constants.Cookies.Session, sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return { success: true, message: "Session created" };
  } catch (error) {
    return { success: false, message: "Failed to create session" };
  }
}

export async function GetNextServerSessionCookie() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("_session_cookie")?.value;

  if (!sessionCookie) {
    throw new Error("No session cookie found");
  }

  try {
    const decondeClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );
    return {
      token: sessionCookie,
      userId: decondeClaims.uid,
    };
  } catch (error) {
    console.error("Error verifying session:", error);
    throw new Error("Invalid Session");
  }
}

export async function GetNextIdToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("_session_token")?.value;

  if (!token) {
    throw new Error("No session cookie found");
  }

  try {
    const decodedClaims = await adminAuth.verifyIdToken(token);
    return {
      token: token,
      userId: decodedClaims.uid,
    };
  } catch (error) {
    console.error("Error verifying session:", error);
    throw new Error("Invalid Session");
  }
}

export async function SetNextServerSession(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set("_session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });
    return { success: true, message: "Session created" };
  } catch {
    return { success: false, message: "Failed to create session" };
  }
}

export async function SetNextServerToken(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set("_tern", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });
    return { success: true, message: "Session created" };
  } catch {
    return { success: false, message: "Failed to create session" };
  }
}

export async function VerifyNextTernIdToken(
  token: string
): Promise<TernVerificationResult> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      ...decodedToken,
      valid: true,
    };
  } catch (error) {
    console.error("[VerifyNextTernIdToken] Error verifying session:", error);
    const authError = handleFirebaseAuthError(error);
    return {
      valid: false,
      error: authError,
    };
  }
}

export async function VerifyNextTernSessionCookie(
  session: string
): Promise<TernVerificationResult> {
  try {
    const res = await adminAuth.verifySessionCookie(session);
    console.warn(
      "[VerifyNextTernSessionCookie] uid in Decoded Token:",
      res.uid
    );
    return {
      valid: true,
      ...res,
    };
  } catch (error) {
    console.error(
      "[VerifyNextTernSessionCookie] Error verifying session:",
      error
    );
    const authError = handleFirebaseAuthError(error);
    return {
      valid: false,
      error: authError,
    };
  }
}

export async function ClearNextSessionCookie(tenantId?: string) {
  try {
    console.log("[clearSessionCookie] Clearing session for tenant:", tenantId);
    const tenantAuth = getAuthForTenant(tenantId);
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_CONSTANTS.COOKIE_NAME);

    cookieStore.delete(SESSION_CONSTANTS.COOKIE_NAME);
    cookieStore.delete(constants.Cookies.IdToken);

    if (
      SESSION_CONSTANTS.REVOKE_REFRESH_TOKENS_ON_SIGNOUT &&
      sessionCookie?.value
    ) {
      try {
        const decodedClaims = await tenantAuth.verifySessionCookie(
          sessionCookie.value
        );
        await tenantAuth.revokeRefreshTokens(decodedClaims.sub);
        console.log(
          `[clearSessionCookie] Successfully revoked tokens for user: ${decodedClaims.sub}`
        );
      } catch (revokeError) {
        console.error(
          "[ClearNextSessionCookie] Failed to revoke refresh tokens:",
          revokeError
        );
      }
    }
    return { success: true, message: "Session cleared successfully" };
  } catch (error) {
    console.error("Error clearing session:", error);
    return { success: false, message: "Failed to clear session cookies" };
  }
}
