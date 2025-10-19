import type { DecodedIdToken, JWTPayload, JWTProtectedHeader } from '@tern-secure/types';

export function mapJwtPayloadToDecodedIdToken(payload: JWTPayload) {
  const decodedIdToken = payload as DecodedIdToken;
  decodedIdToken.uid = decodedIdToken.sub;
  return decodedIdToken;
}

export type { DecodedIdToken, JWTPayload, JWTProtectedHeader };
