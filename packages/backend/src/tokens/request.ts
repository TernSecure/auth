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
import { createRequestProcessor } from './c-authenticateRequestProcessor';
import { createTernSecureRequest } from './ternSecureRequest';
import type { AuthenticateRequestOptions } from './types';
import { verifyToken } from './verify';


function hasAuthorizationHeader(request: Request): boolean {
  return request.headers.has('Authorization');
}

function isRequestForRefresh(error: TokenVerificationError, request: Request) {
  return error.reason === TokenVerificationErrorReason.TokenExpired && request.method === 'GET';
}

export async function authenticateRequest(
  request: Request,
  options: AuthenticateRequestOptions,
): Promise<RequestState> {
  const context = createRequestProcessor(createTernSecureRequest(request), options);

  async function authenticateRequestWithTokenInCookie() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { data, errors } = await verifyToken(context.idTokenInCookie!, options);

      if (errors) {
        throw errors[0];
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const signedInRequestState = signedIn(data, undefined, context.idTokenInCookie!);
      return signedInRequestState;
    } catch (err) {
      return handleError(err, 'cookie');
    }
  }

  async function authenticateRequestWithTokenInHeader() {
    const { sessionTokenInHeader } = context;
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { data, errors } = await verifyToken(sessionTokenInHeader!, options);

      if (errors) {
        throw errors[0];
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const signedInRequestState = signedIn(data, undefined, sessionTokenInHeader!);
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
