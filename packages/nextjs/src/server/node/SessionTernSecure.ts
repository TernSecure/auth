"use server";

import { VerifyNextTernSessionCookie } from "@tern-secure/backend/admin";
import type { TernVerificationResult } from "@tern-secure/types";

export async function verifyFirebaseToken(
  token: string
): Promise<TernVerificationResult> {
  if (!token) {
    return {
      valid: false,
      error: {
        success: false,
        code: "INVALID_TOKEN",
        message: "Token is required for verification",
      },
    };
  }

  try {
    return await VerifyNextTernSessionCookie(token);
  } catch (error) {
    console.error("Error verifying token:", error);
    return {
      valid: false,
      error: {
        success: false,
        code: "INVALID_TOKEN",
        message:
          error instanceof Error ? error.message : "Token verification failed",
      },
    };
  }
}
