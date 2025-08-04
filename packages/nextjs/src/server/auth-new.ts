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
