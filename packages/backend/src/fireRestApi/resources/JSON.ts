export const ObjectType = {
  Client: 'client',
  Cookies: 'cookies',
  Domain: 'domain',
  Email: 'email',
  EmailAddress: 'email_address',
  Invitation: 'invitation',
  PhoneNumber: 'phone_number',
  ProxyCheck: 'proxy_check',
  RedirectUrl: 'redirect_url',
  SamlAccount: 'saml_account',
  Session: 'session',
  SignInAttempt: 'sign_in_attempt',
  SignInToken: 'sign_in_token',
  SignUpAttempt: 'sign_up_attempt',
  SmsMessage: 'sms_message',
  User: 'user',
  Token: 'token',
  TotalCount: 'total_count',
  TestingToken: 'testing_token',
  Role: 'role',
  Permission: 'permission',
} as const;

export type ObjectType = (typeof ObjectType)[keyof typeof ObjectType];


export interface CookiesJSON {
  object: typeof ObjectType.Cookies;
  cookies: string[];
}

export interface TokenJSON {
  object: typeof ObjectType.Token;
  jwt: string;
}

export interface JwksJSON {
  keys?: JwksKeyJSON[];
}

export interface JwksKeyJSON {
  use: string;
  kty: string;
  kid: string;
  alg: string;
  n: string;
  e: string;
}