import type { RequestState } from "./authstate";
import { AuthErrorReason, signedIn, signedOut } from "./authstate";
import { verifyToken } from "./verify";
import type { RequestOptions } from "./types";
import { getSessionConfig } from "./sessionConfig";
import type { ApiClient } from "../api";
import { mergePreDefinedOptions, type buildTimeOptions, type RuntimeOptions} from "../utils/options";

const BEARER_PREFIX = "Bearer ";
const AUTH_COOKIE_NAME = "_session_cookie";



function extractTokenFromHeader(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    return null;
  }

  return authHeader.slice(BEARER_PREFIX.length);
}

function extractTokenFromCookie(
  request: Request,
  opts: RequestOptions
): string | null {
  const cookieHeader = request.headers.get("Cookie") || undefined;
  const sessionName = getSessionConfig(opts).COOKIE_NAME;

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [name, value] = cookie.trim().split("=");
      acc[name] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  return cookies[AUTH_COOKIE_NAME] || null;
}

function hasAuthorizationHeader(request: Request): boolean {
  return request.headers.has("Authorization");
}

export async function authenticateRequest(
  request: Request,
  options: RequestOptions
): Promise<RequestState> {
  async function authenticateRequestWithTokenInCookie() {
    try {
      const token = extractTokenFromCookie(request, options);
      if (!token) {
        return signedOut(AuthErrorReason.SessionTokenMissing);
      }
      const { data, errors } = await verifyToken(token, options);

      if (errors) {
        throw errors[0];
      }

      const signedInRequestState = signedIn(data, undefined, token);
      return signedInRequestState;
    } catch (error) {
      throw error;
    }
  }

  async function authenticateRequestWithTokenInHeader() {
    try {
      const token = extractTokenFromHeader(request);
      if (!token) {
        return signedOut(AuthErrorReason.SessionTokenMissing);
      }

      const { data, errors } = await verifyToken(token, options);

      if (errors) {
        throw errors[0];
      }

      const signedInRequestState = signedIn(data, undefined, token);
      return signedInRequestState;
    } catch (error) {
      throw error;
    }
  }

  if (hasAuthorizationHeader(request)) {
    return authenticateRequestWithTokenInHeader();
  }

  return authenticateRequestWithTokenInCookie();
}

/**
 * @internal
 */
export type CreateAuthenticateRequestOptions = {
  options: buildTimeOptions;
  apiClient: ApiClient;
};

export function createAuthenticateRequest(
  params: CreateAuthenticateRequestOptions
) {
  const buildTimeOptions = mergePreDefinedOptions(params.options);
  const apiClient = params.apiClient;

  const handleAuthenticateRequest = (
    request: Request,
    options: RuntimeOptions = {}
  ) => {
    const { apiUrl } = buildTimeOptions;
    return authenticateRequest(request, { ...options, apiUrl, apiClient });
  };

  return {
    authenticateRequest: handleAuthenticateRequest,
  };
}
