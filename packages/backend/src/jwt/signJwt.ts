import type { JWTPayload } from '@tern-secure/types';
import type { KeyLike } from 'jose';
import { base64url,importPKCS8, SignJWT,  } from 'jose';

import { TokenVerificationError, TokenVerificationErrorReason } from '../utils/errors';
import { fetchAny } from '../utils/fetcher'
import { ALGORITHM_RS256 } from './types';

export interface SignJwtOptions {
  algorithm?: string;
  header?: Record<string, unknown>;
}


export type SignOptions = {
  readonly payload: JWTPayload;
  readonly privateKey: string;
  readonly keyId?: string;
};


async function ternSignJwt(opts: SignOptions): Promise<string> {
  const { payload, privateKey, keyId } = opts;
  let key: KeyLike;

  try {
    key = await importPKCS8(privateKey, ALGORITHM_RS256);
  } catch (error) {
    throw new TokenVerificationError({
      message: `Failed to import private key: ${(error as Error).message}`,
      reason: TokenVerificationErrorReason.TokenInvalid,
    });
  }

  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALGORITHM_RS256, kid: keyId })
    .sign(key);
}


export type SignBlobOptions = {
  readonly serviceAccountId: string;
  readonly accessToken: string;
  readonly payload: JWTPayload;
};


function formatBase64(value: string) {
  return value.replace(/\//g, '_').replace(/\+/g, '-').replace(/=+$/, '');
}

function encodeSegment(segment: Record<string, string> | JWTPayload): string {
  const value = JSON.stringify(segment);

  return formatBase64(base64url.encode(value));
}


async function ternSignBlob({
  payload,
  serviceAccountId,
  accessToken
}: SignBlobOptions): Promise<string> {
  const url = `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountId}:signBlob`;
  const header = {
    alg: ALGORITHM_RS256,
    typ: 'JWT'
  };
  const token = `${encodeSegment(header)}.${encodeSegment(payload)}`;
  const request: RequestInit = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({payload: base64url.encode(token)})
  };
  const response = await fetchAny(url, request);
  const blob = await response.blob();
  const key = await blob.text();
  const {signedBlob} = JSON.parse(key);

  return `${token}.${formatBase64(signedBlob)}`;
}

export { ternSignJwt, ternSignBlob };
