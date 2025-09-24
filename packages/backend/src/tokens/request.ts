import type { ApiClient } from '../fireRestApi';
import type { TokenCarrier } from '../utils/errors';
import { TokenVerificationError, TokenVerificationErrorReason } from '../utils/errors';
import {
  type buildTimeOptions,
  mergePreDefinedOptions,
  type RuntimeOptions,
} from '../utils/options';
import type { RequestState, SignedInState, SignedOutState } from './authstate';
import { AuthErrorReason, signedIn, signedOut } from './authstate';
import type { AuthenticateRequestOptions } from './types';
import { verifyToken } from './verify';

const BEARER_PREFIX = 'Bearer ';
const AUTH_COOKIE_NAME = '_session_cookie';

function extractTokenFromHeader(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    return null;
  }

  return authHeader.slice(BEARER_PREFIX.length);
}

function extractTokenFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie') || undefined;

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return cookies[AUTH_COOKIE_NAME] || null;
}

function hasAuthorizationHeader(request: Request): boolean {
  return request.headers.has('Authorization');
}

function isRequestForRefresh(error: TokenVerificationError, request: Request) {
  return (
    error.reason === TokenVerificationErrorReason.TokenExpired &&
    request.method === 'GET'
  );
}

export async function authenticateRequest(
  request: Request,
  options: AuthenticateRequestOptions,
): Promise<RequestState> {

  async function refreshToken() {
    try {
      const response = await options.apiClient?.tokens.refreshToken(options.firebaseConfig?.apiKey || '' , {
        format: 'cookie',
        refresh_token: '',
        expired_token: '',
        request_origin: options.apiUrl || '',
      })
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  }
  async function authenticateRequestWithTokenInCookie() {
    const token = extractTokenFromCookie(request);
    if (!token) {
      return signedOut(AuthErrorReason.SessionTokenMissing);
    }
    try {
      const { data, errors } = await verifyToken(token, options);

      if (errors) {
        throw errors[0];
      }

      const signedInRequestState = signedIn(data, undefined, token);
      return signedInRequestState;
    } catch (err) {
      return handleError(err, 'cookie');
    }
  }

  async function authenticateRequestWithTokenInHeader() {
    const token = extractTokenFromHeader(request);
    if (!token) {
      return signedOut(AuthErrorReason.SessionTokenMissing, '');
    }
    try {
      const { data, errors } = await verifyToken(token, options);

      if (errors) {
        throw errors[0];
      }

      const signedInRequestState = signedIn(data, undefined, token);
      return signedInRequestState;
    } catch (err) {
      return handleError(err, 'header');
    }
  }

  async function handleError(
    err: unknown,
    tokenCarrier: TokenCarrier,
  ): Promise<SignedInState | SignedOutState> {
    if (!(err instanceof TokenVerificationError)) {
      return signedOut(AuthErrorReason.UnexpectedError);
    }
    let refreshError: string | null;

    err.tokenCarrier = tokenCarrier;

    return signedOut(err.reason, err.getFullMessage());
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

export function createAuthenticateRequest(params: CreateAuthenticateRequestOptions) {
  const buildTimeOptions = mergePreDefinedOptions(params.options);
  const apiClient = params.apiClient;

  const handleAuthenticateRequest = (request: Request, options: RuntimeOptions = {}) => {
    const { apiUrl } = buildTimeOptions;
    return authenticateRequest(request, { ...options, apiUrl, apiClient });
  };

  return {
    authenticateRequest: handleAuthenticateRequest,
  };
}
