import type {
  AuthEndpoint,
  SessionSubEndpoint,
  TernSecureInternalHandlerConfig,
} from '../../types';

export interface HandlerContext {
  request: Request;
  pathSegments: string[];
  endpoint: AuthEndpoint;
  subEndpoint: SessionSubEndpoint | undefined;
  method: string;
}

export interface EndpointHandler {
  canHandle(endpoint: AuthEndpoint): boolean;
  handle(
    handlerContext: HandlerContext,
    config: TernSecureInternalHandlerConfig,
  ): Promise<Response>;
}

export abstract class BaseEndpointHandler implements EndpointHandler {
  abstract canHandle(endpoint: AuthEndpoint): boolean;
  abstract handle(
    handlerContext: HandlerContext,
    config: TernSecureInternalHandlerConfig,
  ): Promise<Response>;

  protected validateMethod(allowedMethods: string[], method: string): boolean {
    return allowedMethods.includes(method);
  }

  protected validateSubEndpoint(
    subEndpoint: SessionSubEndpoint | undefined,
    requiredSubEndpoint?: boolean,
  ): boolean {
    if (requiredSubEndpoint) {
      return subEndpoint !== undefined;
    }
    return true;
  }
}