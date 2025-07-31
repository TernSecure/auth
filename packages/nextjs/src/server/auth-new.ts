import { cache } from "react";
import { headers } from "next/headers";
import type { BaseUser } from "../types";
import { initializeServerConfig } from "../utils/config";
import { TernSecureServer, type AuthenticatedApp } from "@tern-secure/react";

export interface AuthResult {
  user: BaseUser | null;
  error: Error | null;
}

export async function getAuthenticatedApp(): Promise<AuthenticatedApp> {
  try {
    const headersList = await headers();

    const serverAuth = await TernSecureServer({
      firebaseServerConfig: { ...initializeServerConfig() },
    });
    return serverAuth.getAuthenticatedAppFromHeaders(headersList);
  } catch (error) {
    console.error("Failed to get authenticated app:", error);
    throw error;
  }
}

/**
 * Get the current authenticated user from the session or token
 */
export const auth = cache(async (): Promise<AuthResult> => {
  try {
    const { currentUser } = await getAuthenticatedApp();

    if (currentUser) {
      return {
        user: {
          uid: currentUser.uid,
          email: currentUser.email,
          emailVerified: currentUser.emailVerified || false,
          tenantId: currentUser.tenantId || null,
          authTime: currentUser.metadata.lastSignInTime
            ? new Date(currentUser.metadata.lastSignInTime).getTime()
            : undefined,
        },
        error: null,
      };
    }

    return {
      user: null,
      error: null,
    };
  } catch (error) {
    console.error("Auth error:", error);
    return {
      user: null,
      error: error as Error,
    };
  }
});

/**
 * Type guard to check if user is authenticated
 */
export const isAuthenticated = cache(async (): Promise<boolean> => {
  const { user } = await auth();
  return user !== null;
});

/**
 * Get user info from auth result
 */
export const getUser = cache(async (): Promise<BaseUser | null> => {
  const { user } = await auth();
  return user;
});

/**
 * Require authentication
 * Throws error if not authenticated
 */
export const requireAuth = cache(async (): Promise<BaseUser> => {
  const { user, error } = await auth();

  if (!user) {
    throw error || new Error("Authentication required");
  }

  return user;
});
