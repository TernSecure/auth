import {
  JWTPayload,
  ProtectedHeaderParameters,
  decodeProtectedHeader,
  decodeJwt,
  jwtVerify,
  KeyLike
} from "jose";
import type { DecodedIdToken } from "@tern-secure/types";
import { TokenVerificationError, TokenVerificationErrorReason } from "../utils/errors";
import { base64url } from "../utils/rfc4648";
import { JwtReturnType } from "./types";
import {
  verifyHeaderAlgorithm,
  verifyHeaderKid,
  verifySubClaim,
} from "./verifyContent";
import { mapJwtPayloadToDecodedIdToken } from "../utils/mapDecode";

export type JwtDecodedToken = {
  header: ProtectedHeaderParameters;
  payload: JWTPayload;
  signature: Uint8Array;
  raw: {
    header: string;
    payload: string;
    signature: string;
    text: string;
  };
};

function _decodeJwt(
  token: string
): JwtReturnType<JwtDecodedToken, TokenVerificationError> {
  const tokenParts = (token || "").toString().split(".");
  const [rawHeader, rawPayload, rawSignature] = tokenParts;
  const decoder = new TextDecoder();

  const header = JSON.parse(
    decoder.decode(base64url.parse(rawHeader, { loose: true }))
  );
  const payload = JSON.parse(
    decoder.decode(base64url.parse(rawPayload, { loose: true }))
  );

  const signature = base64url.parse(rawSignature, { loose: true });

  const data = {
    header,
    payload,
    signature,
    raw: {
      header: rawHeader,
      payload: rawPayload,
      signature: rawSignature,
      text: token,
    },
  };
  return { data };
}

export function ternDecodeJwt(
  token: string
): JwtReturnType<JwtDecodedToken, TokenVerificationError> {
  const header = decodeProtectedHeader(token);
  const payload = decodeJwt(token);

  const tokenParts = (token || '').toString().split('.');
  if (tokenParts.length !== 3) {
    return { errors: [
      new TokenVerificationError({
        reason: TokenVerificationErrorReason.TokenInvalid,
        message: 'Invalid JWT format'
      })] };
  }
  
  const [rawHeader, rawPayload, rawSignature] = tokenParts;
  const signature = base64url.parse(rawSignature, { loose: true });

  const data = {
    header,
    payload,
    signature,
    raw: {
      header: rawHeader,
      payload: rawPayload,
      signature: rawSignature,
      text: token,
    },
  };

  return { data };
}

export async function verifyJwt(
  token: string
): Promise<JwtReturnType<DecodedIdToken, TokenVerificationError>> {
  const { data: decoded, errors } = ternDecodeJwt(token);
  if (errors) {
    return { errors };
  }

  const { header, payload } = decoded;

  try {
    const { kid } = header;
    verifyHeaderKid(kid);

    const { azp, sub, aud, iat, exp, nbf } = payload;
    verifySubClaim(sub);

  } catch (error) {
    return { errors: [error as TokenVerificationError] };
  }

  const decodedIdToken = mapJwtPayloadToDecodedIdToken(payload);

  return { data: decodedIdToken };
}