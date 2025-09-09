import { NextRequest, NextResponse } from 'next/server';
import {
  TernSecureHandlerOptions,
  TernSecureInternalHandlerConfig,
  DEFAULT_HANDLER_OPTIONS,
  AuthEndpoint,
  SessionSubEndpoint,
} from './types';
import { SessionEndpointHandler } from './sessionHandlers';
import { createApiErrorResponse } from './responses';
import { ConfigUtils, LoggingUtils } from './utils';
import { createRequestContext, createValidators, RequestContext } from './fnValidators';
import { TENANT_ID } from './constants';


/**
 * Apply all global validations in a clean, sequential manner
 */
async function applyGlobalValidations(
  config: Required<TernSecureHandlerOptions>,
  context: RequestContext,
): Promise<NextResponse | null> {
  const { validateCors, validateSecurity, createCorsOptionsResponse } = createValidators(context);
  const corsError = await validateCors(config.cors);
  if (corsError) return corsError;

  if (context.method === 'OPTIONS') {
    return createCorsOptionsResponse(config.cors);
  }

  const securityError = await validateSecurity(config.security);
  if (securityError) return securityError;

  return null;
}

/**
 * Route to appropriate endpoint handler based on endpoint type
 */
async function routeToEndpointHandler(
  request: NextRequest,
  endpoint: AuthEndpoint,
  subEndpoint: SessionSubEndpoint,
  config: TernSecureInternalHandlerConfig,
): Promise<NextResponse> {
  switch (endpoint) {
    case 'sessions':
      return SessionEndpointHandler.handle(request, request.method, subEndpoint, config);
    default:
      return createApiErrorResponse('ENDPOINT_NOT_FOUND', 'Endpoint not found', 404);
  }
}

export function createTernSecureNextJsHandler(options?: TernSecureHandlerOptions) {
  const baseConfig: Required<TernSecureHandlerOptions> = ConfigUtils.mergeWithDefaults(
    DEFAULT_HANDLER_OPTIONS,
    options,
  );

  const internalConfig: TernSecureInternalHandlerConfig = {
    ...baseConfig,
    tenantId: TENANT_ID,
  };

  const handler = async (request: NextRequest): Promise<NextResponse> => {
    const context = createRequestContext(request);
    const { pathSegments } = context;

    const endpoint = pathSegments[2] as AuthEndpoint;
    const subEndpoint = pathSegments[3] as SessionSubEndpoint;

    LoggingUtils.logRequest(request, 'Handler');

    try {
      const validationResult = await applyGlobalValidations(internalConfig, context);
      if (validationResult) {
        return validationResult;
      }

      return await routeToEndpointHandler(request, endpoint, subEndpoint, internalConfig);
    } catch (error) {
      LoggingUtils.logError(error, 'Handler');
      return createApiErrorResponse('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
    }
  };

  return {
    GET: handler,
    POST: handler,
  };
}
