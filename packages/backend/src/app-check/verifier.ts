import type { DecodedAppCheckToken } from '@tern-secure/types';
import { createRemoteJWKSet, type KeyLike, type ProtectedHeaderParameters } from 'jose';

import type { Credential } from '../auth';
import type { JwtReturnType } from '../jwt';
import { ternDecodeJwt, verifyAppCheckJwt, type VerifyJwtOptions } from '../jwt/verifyJwt';
import type { LoadJWKFromRemoteOptions } from '../tokens/keys';
import { TokenVerificationError, TokenVerificationErrorReason } from '../utils/errors';

export type VerifyAppcheckOptions = Omit<VerifyJwtOptions, 'key'> & Omit<LoadJWKFromRemoteOptions, 'kid'> & {
  currentDate?: Date;
  checkRevoked?: boolean;
  referer?: string;
  experimental_enableTokenRefreshOnExpiredKidHeader?: boolean;
};

const getPublicKey = async (header: ProtectedHeaderParameters, keyURL: string): Promise<KeyLike> => {
  const jswksUrl: URL = new URL(keyURL);
  const getKey = createRemoteJWKSet(jswksUrl);

  return getKey(header);

}


const verifyAppCheckToken = async (
  token: string,
  options: VerifyAppcheckOptions,
): Promise<JwtReturnType<DecodedAppCheckToken, TokenVerificationError>> => {
  const { data: decodedResult, errors } = ternDecodeJwt(token);

  if (errors) {
    throw errors[0];
  }

  const { header } = decodedResult;
  const { kid } = header;

  if (!kid) {
    return {
      errors: [
        new TokenVerificationError({
          reason: TokenVerificationErrorReason.TokenInvalid,
          message: 'JWT "kid" header is missing.',
        }),
      ],
    };
  }

  try {
    const getPublicKeyForToken = () => getPublicKey(header, options.keyURL || '');

    return await verifyAppCheckJwt(token, { ...options, key: getPublicKeyForToken });
  } catch (error) {
    if (error instanceof TokenVerificationError) {
      return { errors: [error] };
    }
    return {
      errors: [error as TokenVerificationError],
    };
  }
};

export class AppcheckTokenVerifier {
  constructor(private readonly credential: Credential) { }

  public verifyToken = async (
    token: string,
    projectId: string,
    options: VerifyAppcheckOptions,
  ): Promise<DecodedAppCheckToken> => {
    const { data, errors } = await verifyAppCheckToken(token, options);
    if (errors) {
      throw errors[0];
    }

    return data;
  };
}