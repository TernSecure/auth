import type { AuthEndpoint, AuthSubEndpoint } from '@tern-secure/types';

import { constants } from '../constants';
import type { TernSecureRequest } from './ternSecureRequest';
import type { AuthenticateRequestOptions } from './types';


/**
 * Request context for better type safety and clarity
 */
interface RequestProcessorContext extends AuthenticateRequestOptions {
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
  appCheckToken: string | undefined;

  // cookie-based values
  idTokenInCookie: string | undefined;
  refreshTokenInCookie: string | undefined;
  csrfTokenInCookie: string | undefined;
  sessionTokenInCookie?: string | undefined;
  customTokenInCookie?: string | undefined;
  ternAuth: number;

  handshakeNonce: string | undefined;
  handshakeToken: string | undefined;

  method: string;
  pathSegments: string[];
  endpoint?: AuthEndpoint;
  subEndpoint?: AuthSubEndpoint;

  ternUrl: URL;
  instanceType: string;
}

/**
 * Request processor utility class for common operations
 */
class RequestProcessorContext implements RequestProcessorContext {
  public constructor(
    private ternSecureRequest: TernSecureRequest,
    private options: AuthenticateRequestOptions,
  ) {
    this.initHeaderValues();
    this.initCookieValues();
    this.initHandshakeValues();
    this.initUrlValues();
    Object.assign(this, options);
    this.ternUrl = this.ternSecureRequest.ternUrl;
  }

  public get request(): TernSecureRequest {
    return this.ternSecureRequest;
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
    this.appCheckToken = this.getHeader(constants.Headers.AppCheckToken);
  }

  private initCookieValues() {
    const isProduction = process.env.NODE_ENV === 'production';
    const defaultPrefix = isProduction ? '__HOST-' : '__dev_';
    this.sessionTokenInCookie = this.getCookie(constants.Cookies.Session);

    // System-fixed cookies using backend constants
    this.idTokenInCookie = this.getCookie(`${defaultPrefix}${constants.Cookies.IdToken}`);
    this.refreshTokenInCookie = this.getCookie(`${defaultPrefix}${constants.Cookies.Refresh}`);
    this.csrfTokenInCookie = this.getCookie(constants.Cookies.CsrfToken);
    this.customTokenInCookie = this.getCookie(constants.Cookies.Custom);
    this.ternAuth = Number.parseInt(this.getCookie(constants.Cookies.TernAut) || '0', 10);
  }

  private initHandshakeValues() {
    this.handshakeToken = this.getQueryParam(constants.QueryParameters.Handshake) || this.getCookie(constants.Cookies.Handshake);
    this.handshakeNonce = this.getQueryParam(constants.QueryParameters.HandshakeNonce) || this.getCookie(constants.Cookies.HandshakeNonce);
  }

  private initUrlValues() {
    this.method = this.ternSecureRequest.method;
    this.pathSegments = this.ternSecureRequest.ternUrl.pathname.split('/').filter(Boolean);
    this.endpoint = this.pathSegments[2] as AuthEndpoint;
    this.subEndpoint = this.pathSegments[3] as AuthSubEndpoint;
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

export const createRequestProcessor = (
  ternSecureRequest: TernSecureRequest,
  options: AuthenticateRequestOptions,
): RequestProcessorContext => {
  return new RequestProcessorContext(ternSecureRequest, options);
};
