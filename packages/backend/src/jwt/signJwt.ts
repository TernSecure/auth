import { JWTPayload, KeyLike, SignJWT, base64url, importPKCS8 } from 'jose';
import { JwtReturnType } from './types';
import { getCryptoAlgorithm } from './algorithms';

export interface SignJwtOptions {
  algorithm?: string;
  header?: Record<string, unknown>;
}
