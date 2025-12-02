import type { AuthenticateRequestOptions } from '@tern-secure/backend';
import { createRequestProcessor, createTernSecureRequest } from '@tern-secure/backend';

import { TENANT_ID } from './constants';
import { EndpointRouter } from './endpointRouter';
import { createApiErrorResponse } from './responses';
import { DEFAULT_API_HANDLER_OPTIONS } from './types';

/**
 * Create API route handlers with unified options
 * Uses the same AuthenticateRequestOptions as middleware
 */
export function createTernSecureNextJsHandler(options?: AuthenticateRequestOptions) {
  const config: AuthenticateRequestOptions = {
    ...DEFAULT_API_HANDLER_OPTIONS,
    ...options,
    tenantId: options?.tenantId || TENANT_ID,
  };

  const handler = async (request: Request): Promise<Response> => {
    try {
      
      const ternRequest = createTernSecureRequest(request);
      const context = createRequestProcessor(ternRequest, config);

      if (!context.endpoint) {
        return createApiErrorResponse('ENDPOINT_REQUIRED', 'Endpoint is required', 400);
      }

      return await EndpointRouter.route(context, config);
    } catch (error) {
      return createApiErrorResponse('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
    }
  };

  return {
    GET: handler,
    POST: handler,
  } as const;
}
