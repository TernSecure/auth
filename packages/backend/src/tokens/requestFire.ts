import type { RequestState } from './authstate';
import { AuthErrorReason, signedIn, signedOut } from './authstate';
import { verifyToken } from './verify';
import type { RequestOptions, AuthenticateFireRequestOptions } from './types';
import { getSessionConfig } from './sessionConfig';

type RuntimeOptions = Omit<
  AuthenticateFireRequestOptions,
  'firebaseConfig'
>;

type FirebaseOptions = Partial<
  Pick<
    AuthenticateFireRequestOptions,
    'firebaseConfig'
  >
>;

const defaultFirebaseOptions = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  tenantId: undefined,
} as FirebaseOptions;

export function mergePreDefinedOptions<T extends Record<string, any>>(
  preDefinedOptions: T,
  options: Partial<T>,
): T {
  return Object.keys(preDefinedOptions).reduce(
    (obj: T, key: string) => {
      return { ...obj, [key]: options[key] || obj[key] };
    },
    { ...preDefinedOptions },
  );
}

const BEARER_PREFIX = 'Bearer ';
const AUTH_COOKIE_NAME = '_session_cookie';

function extractTokenFromHeader(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    return null;
  }

  return authHeader.slice(BEARER_PREFIX.length);
}

function extractTokenFromCookie(request: Request, opts: RequestOptions): string | null {
  const cookieHeader = request.headers.get('Cookie') || undefined;
  const sessionName = getSessionConfig(opts).COOKIE_NAME;

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

export async function authenticateRequest(
  request: Request,
  options: AuthenticateFireRequestOptions,
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
export type CreateFireAuthenticateRequestOptions = {
  options: FirebaseOptions;
};

export function createFireAuthenticateRequest(params: CreateFireAuthenticateRequestOptions) {
  const buildTimeOptions = mergePreDefinedOptions(defaultFirebaseOptions, params.options);

  const handleAuthenticateRequest = (request: Request, options: RuntimeOptions = {}) => {
    const runtimeOptions = { ...buildTimeOptions, ...options };
    return authenticateRequest(request, runtimeOptions);
  };

  return {
    authenticateRequest: handleAuthenticateRequest,
  };
}
