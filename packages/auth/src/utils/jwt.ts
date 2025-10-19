import { decodeJwt, decodeProtectedHeader } from 'jose';

import type { DecodedIdToken, JWTPayload, JWTProtectedHeader } from './mapDecode';
import { mapJwtPayloadToDecodedIdToken } from './mapDecode';

type JWT = {
  encoded: { header: JWTProtectedHeader; payload: JWTPayload; signature: string };
  decoded: DecodedIdToken;
};

export function decode(token: string): JWT {
  const header = decodeProtectedHeader(token);
  const payload = decodeJwt(token);

  const parts = (token || '').split('.');
  const [signature] = parts;

  const data = {
    header,
    payload,
    signature,
  };

  const decoded = mapJwtPayloadToDecodedIdToken(payload);

  return {
    encoded: data,
    decoded,
  };
}
