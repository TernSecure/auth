import type { JWTPayload } from '@tern-secure/types';
import type { KeyLike } from 'jose';
import { importPKCS8, SignJWT } from 'jose';

import { TokenVerificationError, TokenVerificationErrorReason } from '../utils/errors';

export interface SignJwtOptions {
  algorithm?: string;
  header?: Record<string, unknown>;
}

export const ALGORITHM_RS256 = 'RS256' as const;


export type SignOptions = {
  readonly payload: JWTPayload;
  readonly privateKey: string;
  readonly keyId?: string;
};


export async function ternSignJwt(opts: SignOptions): Promise<string> {
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
