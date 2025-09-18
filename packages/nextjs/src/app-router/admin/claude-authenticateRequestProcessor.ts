import type { TernSecureRequest } from '@tern-secure/backend';
import { constants } from '@tern-secure/backend';

import type { TernSecureHandlerOptions} from './types';

/**
 * Request context for better type safety and clarity
 */
interface RequestProcessorContext extends TernSecureHandlerOptions {
  // header-based values
  sessionTokenInHeader: string | undefined;
  origin: string | undefined;
  host: string | undefined;
  forwardedHost: string | undefined;
  forwardedProto: string | undefined;
  referrer: string | undefined;
  userAgent: string | undefined;
  secFetchDest: string | undefined;
  accept: string | undefined;

  // cookie-based values
  sessionTokenInCookie: string | undefined;
  refreshTokenInCookie: string | undefined;
  csrfTokenInCookie: string | undefined;

  ternUrl: URL;
}

/**
 * Request processor utility class for common operations
 */
class RequestProcessorContext implements RequestProcessorContext {
  public constructor(
    private ternSecureRequest: TernSecureRequest,
    private options: TernSecureHandlerOptions,
  ) {
    this.initHeaderValues();
    this.initCookieValues();
    this.ternUrl = this.ternSecureRequest.ternUrl;
  }

  private initHeaderValues() {
    this.sessionTokenInHeader = this.parseAuthorizationHeader(
      this.getHeader(constants.Headers.Authorization),
    );
    this.origin = this.getHeader(constants.Headers.Origin);
    this.host = this.getHeader(constants.Headers.Host);
    this.forwardedHost = this.getHeader(constants.Headers.ForwardedHost);
    this.forwardedProto =
      this.getHeader(constants.Headers.CloudFrontForwardedProto) ||
      this.getHeader(constants.Headers.ForwardedProto);
    this.referrer = this.getHeader(constants.Headers.Referrer);
    this.userAgent = this.getHeader(constants.Headers.UserAgent);
    this.secFetchDest = this.getHeader(constants.Headers.SecFetchDest);
    this.accept = this.getHeader(constants.Headers.Accept);
  }

  private initCookieValues() {
    //this.sessionTokenInCookie = this.getCookie(this.options.cookies.name);
    this.csrfTokenInCookie = this.getCookie(constants.Cookies.CsrfToken);
  }

  private getQueryParam(name: string) {
    return this.ternSecureRequest.ternUrl.searchParams.get(name);
  }

  private getHeader(name: string) {
    return this.ternSecureRequest.headers.get(name) || undefined;
  }

  private getCookie(name: string) {
    return this.ternSecureRequest.cookies.get(name) || undefined;
  }

  private parseAuthorizationHeader(
    authorizationHeader: string | undefined | null,
  ): string | undefined {
    if (!authorizationHeader) {
      return undefined;
    }

    const [scheme, token] = authorizationHeader.split(' ', 2);

    if (!token) {
      // No scheme specified, treat the entire value as the token
      return scheme;
    }

    if (scheme === 'Bearer') {
      return token;
    }

    // Skip all other schemes
    return undefined;
  }
}

export type { RequestProcessorContext };

export const createRequestProcessor = async (
  ternSecureRequest: TernSecureRequest,
  options: TernSecureHandlerOptions,
): Promise<RequestProcessorContext> => {
  return new RequestProcessorContext(ternSecureRequest, options);
};
