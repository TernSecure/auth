import type { RequestContext } from './fnValidators';
import { createRequestContext, createValidators } from './fnValidators';
import type {
  AuthEndpoint,
  SessionSubEndpoint,
  TernSecureHandlerOptions,
} from './types';

export interface HandlerContext {
  request: Request;
  pathSegments: string[];
  endpoint: AuthEndpoint;
  subEndpoint: SessionSubEndpoint | undefined;
  method: string;
}

export class RequestContextBuilder {
  static create(request: Request): HandlerContext {
    const context = createRequestContext(request);
    const { pathSegments } = context;

    return {
      request,
      pathSegments,
      endpoint: pathSegments[2] as AuthEndpoint,
      subEndpoint: pathSegments[3] as SessionSubEndpoint | undefined,
      method: request.method,
    };
  }
}

export class ValidationPipeline {
  private readonly config: Required<TernSecureHandlerOptions>;
  private readonly context: RequestContext;

  constructor(
    config: Required<TernSecureHandlerOptions>,
    context: RequestContext,
  ) {
    this.config = config;
    this.context = context;
  }

  async execute(): Promise<Response | null> {
    const validators = createValidators(this.context);

    const corsError = await validators.validateCors(this.config.cors);
    if (corsError) return corsError;

    if (this.context.method === 'OPTIONS') {
      return validators.createCorsOptionsResponse(this.config.cors);
    }

    const securityError = await validators.validateSecurity(this.config.security);
    if (securityError) return securityError;

    return null;
  }
}

