
import { TENANT_ID } from './constants';
import { EndpointRouter } from './endpointRouter';
import { createRequestContext } from './fnValidators';
import { RequestContextBuilder, ValidationPipeline } from './handlerUtils';
import { createApiErrorResponse } from './responses';
import type { TernSecureHandlerOptions, TernSecureInternalHandlerConfig } from './types';
import { DEFAULT_HANDLER_OPTIONS } from './types';
import { ConfigUtils } from './utils';

class HandlerConfigFactory {
  static create(options?: TernSecureHandlerOptions): TernSecureInternalHandlerConfig {
    const baseConfig: Required<TernSecureHandlerOptions> = ConfigUtils.mergeWithDefaults(
      DEFAULT_HANDLER_OPTIONS,
      options,
    );

    return {
      ...baseConfig,
      tenantId: TENANT_ID,
    };
  }
}

class TernSecureRequestHandler {
  private readonly config: TernSecureInternalHandlerConfig;

  constructor(config: TernSecureInternalHandlerConfig) {
    this.config = config;
  }

  async handle(request: Request): Promise<Response> {
    const handlerContext = RequestContextBuilder.create(request);
    const validationContext = createRequestContext(request);

    try {
      const validationResult = await this.executeValidation(validationContext);
      if (validationResult) {
        return validationResult;
      }

      return await EndpointRouter.route(handlerContext, this.config);
    } catch (error) {
      return createApiErrorResponse('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
    }
  }

  private async executeValidation(validationContext: any): Promise<Response | null> {
    const validationPipeline = new ValidationPipeline(this.config, validationContext);
    return validationPipeline.execute();
  }
}

export function createTernSecureNextJsHandler(options: TernSecureHandlerOptions) {
  const config = HandlerConfigFactory.create(options);
  const requestHandler = new TernSecureRequestHandler(config);

  const handler = async (request: Request) => await requestHandler.handle(request);

  //const handler = async (request: Request): Promise<Response> => {
  //  const context = await createRequestProcessor(createTernSecureRequest(request), options);
  //  const { validateCors, validateSecurity } = createValidators(context);
  //  await validateCors(options.cors || '');
  //  await validateSecurity(options.security || {});
  //};

  return {
    GET: handler,
    POST: handler,
  } as const;
}
