export interface FirebaseClaims {
  identities: {
    [key: string]: unknown;
  };
  sign_in_provider: string;
  sign_in_second_factor?: string;
  second_factor_identifier?: string;
  tenant?: string;
  [key: string]: unknown;
}

export interface DecodedIdToken {
  aud: string;
  auth_time: number;
  email?: string;
  email_verified?: boolean;
  exp: number;
  firebase: FirebaseClaims;
  iat: number;
  iss: string;
  phone_number?: string;
  picture?: string;
  sub: string;
  uid: string;
  [key: string]: any;
}

export interface DecodedAppCheckToken {
    iss: string;
    sub: string;
    aud: string[];
    exp: number;
    iat: number;
    app_id: string;
    [key: string]: unknown;
}

export interface VerifiedTokens {
  IdToken: string;
  DecodedIdToken: DecodedIdToken;
}

export interface VerifyAppCheckTokenResponse {
    appId: string;
    token: DecodedAppCheckToken;
}

export interface JWTProtectedHeader {
  alg?: string
  kid?: string
  x5t?: string
  x5c?: string[]
  x5u?: string
  jku?: string
  typ?: string
  cty?: string
  crit?: string[]
  b64?: boolean
  enc?: string
  [propName: string]: unknown
}


export interface JWTPayload {
  iss?: string
  sub?: string
  aud?: string | string[]
  jti?: string
  nbf?: number
  exp?: number
  iat?: number
  [propName: string]: unknown
}

export type Jwt = {
  header: JWTProtectedHeader;
  payload: JWTPayload;
  signature: Uint8Array;
  raw: {
    header: string;
    payload: string;
    signature: string;
    text: string;
  };
};