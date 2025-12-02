import type { AuthenticateRequestOptions, RequestProcessorContext } from '@tern-secure/backend';
import { clearSessionCookie } from '@tern-secure/backend/admin';
import { ternDecodeJwtUnguarded } from '@tern-secure/backend/jwt';

import { ternSecureBackendClient } from '../../server/ternsecureClient';
import { NextCookieStore } from '../../utils/NextCookieAdapter';
import { FIREBASE_API_KEY } from './constants';
import { refreshCookieWithIdToken } from './request';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  HttpResponseHelper,
  SessionResponseHelper,
} from './responses';
import { processSignInCreate } from './signInCreateHandler';
import type { SessionSubEndpoint, SignInSubEndpoint,  } from './types';
import {
  extractSessionRequestData,
  validateCsrfToken,
  validateEmail,
  validateIdToken,
  validateSubEndpointPresent,
} from './validators';

const sessionEndpointHandler = async (
  context: RequestProcessorContext,
  config: AuthenticateRequestOptions,
): Promise<Response> => {
  const { subEndpoint, method, referrer } = context;

  // Validate sub-endpoint exists
  const subEndpointError = validateSubEndpointPresent(context, 'Session');
  if (subEndpointError) return subEndpointError;

  const SessionGetHandler = async (subEndpoint: SessionSubEndpoint): Promise<Response> => {
    const handleSessionVerify = async (): Promise<Response> => {
      try {
        const sessionCookie = context.sessionTokenInCookie;
        if (!sessionCookie) {
          return SessionResponseHelper.createUnauthorizedResponse();
        }

        const { data: decodedSession, errors } = ternDecodeJwtUnguarded(sessionCookie);
        if (errors) {
          return SessionResponseHelper.createUnauthorizedResponse();
        }

        return SessionResponseHelper.createVerificationResponse(decodedSession);
      } catch (error) {
        return SessionResponseHelper.createUnauthorizedResponse();
      }
    };

    switch (subEndpoint) {
      case 'verify':
        return handleSessionVerify();
      default:
        return HttpResponseHelper.createNotFoundResponse();
    }
  };

  const SessionPostHandler = async (subEndpoint: SessionSubEndpoint): Promise<Response> => {
    const cookieStore = new NextCookieStore();

    const { idToken, csrfToken, error } = await extractSessionRequestData(context.request);
    if (error) return error;

    const csrfError = await validateCsrfToken(csrfToken);
    if (csrfError) return csrfError;

    const handleCreateSession = async (
      cookieStore: NextCookieStore,
      idToken: string,
    ): Promise<Response> => {
      try {
        await refreshCookieWithIdToken(idToken, cookieStore, config, referrer, context.appCheckToken);
        return SessionResponseHelper.createSessionCreationResponse({
          success: true,
          message: 'Session created successfully',
        });
      } catch (error) {
        console.error('[SessionHandler - createsession] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Session creation failed';
        return createApiErrorResponse('SESSION_CREATION_FAILED', errorMessage, 500);
      }
    };

    const handleRefreshSession = async (
      cookieStore: NextCookieStore,
      idToken: string,
    ): Promise<Response> => {
      try {
        const decodedSession = ternDecodeJwtUnguarded(idToken);
        if (decodedSession.errors) {
          return createApiErrorResponse('INVALID_SESSION', 'Invalid session for refresh', 401);
        }

        const refreshRes = await refreshCookieWithIdToken(
          idToken,
          cookieStore,
          config,
          undefined,
          context.appCheckToken,
        );
        return SessionResponseHelper.createRefreshResponse(refreshRes);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Session refresh failed';
        return createApiErrorResponse('REFRESH_FAILED', errorMessage, 500);
      }
    };

    const handleRevokeSession = async (cookieStore: NextCookieStore): Promise<Response> => {
      const res = await clearSessionCookie(cookieStore);
      return SessionResponseHelper.createRevokeResponse(res);
    };

    switch (subEndpoint) {
      case 'createsession': {
        const idTokenError = validateIdToken(idToken);
        if (idTokenError) return idTokenError;
        //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return handleCreateSession(cookieStore, idToken!);
      }

      case 'refresh':
        //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return handleRefreshSession(cookieStore, idToken!);

      case 'revoke':
        return handleRevokeSession(cookieStore);

      default:
        return HttpResponseHelper.createSubEndpointNotSupportedResponse();
    }
  };

  switch (method) {
    case 'GET':
      return SessionGetHandler(subEndpoint as SessionSubEndpoint);

    case 'POST':
      return SessionPostHandler(subEndpoint as SessionSubEndpoint);

    default:
      return HttpResponseHelper.createMethodNotAllowedResponse();
  }
}


const signInEndpointHandler = async (
  context: RequestProcessorContext,
): Promise<Response> => {
  const { subEndpoint, method } = context;

  // Validate sub-endpoint exists
  const subEndpointError = validateSubEndpointPresent(context, 'Sign_ins');
  if (subEndpointError) return subEndpointError;

  const PostHandler = async (subEndpoint: SignInSubEndpoint): Promise<Response> => {
    const create = async (): Promise<Response> => {
      return await processSignInCreate(context);
    };

    const passwordResetEmail = async (): Promise<Response> => {
      try {
        const body = await context.request.json();
        const { email } = body;

        const emailError = validateEmail(email);
        if (emailError) return emailError;

        const backendClient = await ternSecureBackendClient();

        const response = await backendClient.signIn.resetPasswordEmail(FIREBASE_API_KEY, {
          email,
          requestType: 'PASSWORD_RESET',
        });

        if (!response) {
          return createApiErrorResponse(
            'PASSWORD_RESET_FAILED',
            'Failed to send password reset email',
            500,
          );
        }

        return createApiSuccessResponse({
          email,
        });
      } catch (error) {
        return createApiErrorResponse(
          'PASSWORD_RESET_ERROR',
          error instanceof Error
            ? error.message
            : 'An error occurred while sending password reset email',
          500,
        );
      }
    };

    switch (subEndpoint) {
      case 'create':
        return create();
      case 'resetPasswordEmail':
        return passwordResetEmail();
      default:
        return HttpResponseHelper.createSubEndpointNotSupportedResponse();
    }
  };

  switch (method) {
    case 'POST':
      return PostHandler(subEndpoint as SignInSubEndpoint);

    default:
      return HttpResponseHelper.createMethodNotAllowedResponse();
  }

}

export { sessionEndpointHandler, signInEndpointHandler };
