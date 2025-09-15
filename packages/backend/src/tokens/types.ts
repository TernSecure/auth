import type { CheckRevokedOptions } from '../adapters';
import type { ApiClient } from '../api';
import type { TernSecureConfig,VerifyTokenVOptions } from './verify';

export type SessionCookieAttributes = {
  path?: string;
  domain?: string;
  expires?: Date;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
};

export type SessionCookieFromMiddleware = {
  name: string;
  attributes: SessionCookieAttributes;
  revokeRefreshTokensOnSignOut?: boolean;
};

export type MiddlewareCookiesOptions = {
  session_cookie: SessionCookieFromMiddleware;
};

export type RequestOptions = {
  tenantId?: string;
  signInUrl?: string;
  signUpUrl?: string;
  checkRevoked?: CheckRevokedOptions;
  cookies?: MiddlewareCookiesOptions;
  apiClient?: ApiClient;
  apiUrl?: string;
  apiVersion?: string;
} & VerifyTokenVOptions;

export type AuthenticateFireRequestOptions = {
  signInUrl?: string;
  signUpUrl?: string;
  checkRevoked?: CheckRevokedOptions;
  cookies?: MiddlewareCookiesOptions;
  apiClient?: ApiClient;
  apiUrl?: string;
  apiVersion?: string;
  firebaseConfig?: TernSecureConfig
} & VerifyTokenVOptions;
