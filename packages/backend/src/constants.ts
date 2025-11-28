export const GOOGLE_PUBLIC_KEYS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
export const SESSION_COOKIE_PUBLIC_KEYS_URL =
  'https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys';

export const FIREBASE_APP_CHECK_AUDIENCE =
  'https://firebaseappcheck.googleapis.com/google.firebase.appcheck.v1.TokenExchangeService';

export const MAX_CACHE_LAST_UPDATED_AT_SECONDS = 5 * 60;
export const DEFAULT_CACHE_DURATION = 3600 * 1000; // 1 hour in milliseconds
export const CACHE_CONTROL_REGEX = /max-age=(\d+)/;

export const TOKEN_EXPIRY_THRESHOLD_MILLIS = 5 * 60 * 1000;
export const GOOGLE_TOKEN_AUDIENCE = 'https://accounts.google.com/o/oauth2/token';
export const GOOGLE_AUTH_TOKEN_HOST = 'accounts.google.com';
export const GOOGLE_AUTH_TOKEN_PATH = '/o/oauth2/token';
export const ONE_HOUR_IN_SECONDS = 60 * 60;

export const ONE_MINUTE_IN_SECONDS = 60;
export const ONE_MINUTE_IN_MILLIS = ONE_MINUTE_IN_SECONDS * 1000;
export const ONE_DAY_IN_MILLIS = 24 * 60 * 60 * 1000;

const Attributes = {
  AuthToken: '__ternsecureAuthToken',
  AuthSignature: '__ternsecureAuthSignature',
  AuthStatus: '__ternsecureAuthStatus',
  AuthReason: '__ternsecureAuthReason',
  AuthMessage: '__ternsecureAuthMessage',
  TernSecureUrl: '__ternsecureUrl',
} as const;

const Cookies = {
  Session: '__session',
  CsrfToken: '__terncf',
  IdToken: 'TernSecure_[DEFAULT]',
  Refresh: 'TernSecureID_[DEFAULT]',
  Custom: '__custom',
  TernAut: 'tern_aut',
  Handshake: '__ternsecure_handshake',
  DevBrowser: '__ternsecure_db_jwt',
  RedirectCount: '__ternsecure_redirect_count',
  HandshakeNonce: '__ternsecure_handshake_nonce',
} as const;


const QueryParameters = {
  TernSynced: '__tern_synced',
  SuffixedCookies: 'suffixed_cookies',
  TernRedirectUrl: '__tern_redirect_url',
  // use the reference to Cookies to indicate that it's the same value
  DevBrowser: Cookies.DevBrowser,
  Handshake: Cookies.Handshake,
  HandshakeHelp: '__tern_help',
  LegacyDevBrowser: '__dev_session',
  HandshakeReason: '__tern_hs_reason',
  HandshakeNonce: Cookies.HandshakeNonce,
} as const;

const Headers = {
  Accept: 'accept',
  AppCheckToken: 'x-firebase-appcheck',
  AuthMessage: 'x-ternsecure-auth-message',
  Authorization: 'authorization',
  AuthReason: 'x-ternsecure-auth-reason',
  AuthSignature: 'x-ternsecure-auth-signature',
  AuthStatus: 'x-ternsecure-auth-status',
  AuthToken: 'x-ternsecure-auth-token',
  CacheControl: 'cache-control',
  TernSecureRedirectTo: 'x-ternsecure-redirect-to',
  TernSecureRequestData: 'x-ternsecure-request-data',
  TernSecureUrl: 'x-ternsecure-url',
  CloudFrontForwardedProto: 'cloudfront-forwarded-proto',
  ContentType: 'content-type',
  ContentSecurityPolicy: 'content-security-policy',
  ContentSecurityPolicyReportOnly: 'content-security-policy-report-only',
  EnableDebug: 'x-ternsecure-debug',
  ForwardedHost: 'x-forwarded-host',
  ForwardedPort: 'x-forwarded-port',
  ForwardedProto: 'x-forwarded-proto',
  Host: 'host',
  Location: 'location',
  Nonce: 'x-nonce',
  Origin: 'origin',
  Referrer: 'referer',
  SecFetchDest: 'sec-fetch-dest',
  UserAgent: 'user-agent',
  ReportingEndpoints: 'reporting-endpoints',
} as const;

const ContentTypes = {
  Json: 'application/json',
} as const;

/**
 * @internal
 */
export const constants = {
  Attributes,
  Cookies,
  Headers,
  ContentTypes,
  QueryParameters,
} as const;

export type Constants = typeof constants;
