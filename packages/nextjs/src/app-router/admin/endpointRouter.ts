import type { EndpointHandler} from './api/endpoints/abstract';
import type { HandlerContext } from './handlerUtils';
import { createApiErrorResponse } from './responses';
import { SessionEndpointHandler } from './sessionHandlers';
import type { AuthEndpoint, TernSecureInternalHandlerConfig } from './types';

class SessionsHandler implements EndpointHandler {
  canHandle(endpoint: AuthEndpoint): boolean {
    return endpoint === 'sessions';
  }

  async handle(
    handlerContext: HandlerContext,
    config: TernSecureInternalHandlerConfig,
  ): Promise<Response> {
    const { request, subEndpoint, method } = handlerContext;
    return await SessionEndpointHandler.handle(request, method, subEndpoint, config);
  }
}

class UsersHandler implements EndpointHandler {
  canHandle(endpoint: AuthEndpoint): boolean {
    return endpoint === 'users';
  }

  handle(
    _handlerContext: HandlerContext,
    _config: TernSecureInternalHandlerConfig,
  ): Promise<Response> {
    return Promise.resolve(
      createApiErrorResponse('ENDPOINT_NOT_IMPLEMENTED', 'Users endpoint not implemented', 501),
    );
  }
}

export class EndpointRouter {
  private static readonly handlers: EndpointHandler[] = [
    new SessionsHandler(),
    new UsersHandler(),
  ];

  static async route(
    handlerContext: HandlerContext,
    config: TernSecureInternalHandlerConfig,
  ): Promise<Response> {
    const { endpoint } = handlerContext;

    const handler = this.handlers.find(h => h.canHandle(endpoint));

    if (!handler) {
      return createApiErrorResponse('ENDPOINT_NOT_FOUND', 'Endpoint not found', 404);
    }

    return handler.handle(handlerContext, config);
  }

  static addHandler(handler: EndpointHandler): void {
    this.handlers.push(handler);
  }

  static removeHandler(predicate: (handler: EndpointHandler) => boolean): void {
    const index = this.handlers.findIndex(predicate);
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
  }
}