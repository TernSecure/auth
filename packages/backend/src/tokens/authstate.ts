import type {
  JWTPayload
} from "jose";
import {
  TernSecureRequest,
} from "./ternSecureRequest";
import type {
  CheckAuthorizationFromSessionClaims,
  DecodedIdToken,
} from "@tern-secure/types";
import { mapJwtPayloadToDecodedIdToken } from "../utils/mapDecode";

export const AuthStatus = {
  SignedIn: 'signed-in',
  SignedOut: 'signed-out',
} as const;

export type AuthStatus = (typeof AuthStatus)[keyof typeof AuthStatus];

export type SignedInAuthObject = {
  session: DecodedIdToken;
  userId: string;
  has: CheckAuthorizationFromSessionClaims;
  error: string | null;
};

export type SignedOutAuthObject = {
  session: null;
  userId: null;
  has: CheckAuthorizationFromSessionClaims;
  error: string | null;
};

export type SignedInState = {
  status: typeof AuthStatus.SignedIn;
  isSignedIn: true;
  auth: () => SignedInAuthObject;
  token: string;
  headers: Headers;
};

export type SignedOutState = {
  status: typeof AuthStatus.SignedOut;
  isSignedIn: false;
  auth: () => SignedOutAuthObject;
  token: null;
  headers: Headers;
};

export type RequestState = SignedInState | SignedOutState;

export interface BackendInstance {
  ternSecureRequest: TernSecureRequest;
  requestState: RequestState;
}

export type AuthObject = SignedInAuthObject | SignedOutAuthObject;

export function signedInAuthObject(session: JWTPayload): SignedInAuthObject {
  const decodedIdToken = mapJwtPayloadToDecodedIdToken(session)
  return {
    session: {
      ...decodedIdToken,
    },
    userId: decodedIdToken.uid,
    has: {} as CheckAuthorizationFromSessionClaims,
    error: null,
  };
}


export function signedIn(
  session: JWTPayload,
  headers: Headers = new Headers(),
  token: string
): SignedInState {
  const authObject = signedInAuthObject(session);
  return {
    status: AuthStatus.SignedIn,
    isSignedIn: true,
    auth: () => authObject,
    token,
    headers,
  };
}

export function signedOut(
  headers: Headers = new Headers()
): SignedOutState{
  return {
    status: AuthStatus.SignedOut,
    isSignedIn: false,
    auth: () => ({
      session: null,
      userId: null,
      has: {} as CheckAuthorizationFromSessionClaims,
      error: null,
    }),
    token: null,
    headers,
  };
}