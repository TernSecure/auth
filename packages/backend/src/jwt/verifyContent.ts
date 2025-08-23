import { TokenVerificationError, TokenVerificationErrorReason } from "../utils/errors";
import { algs } from './algorithms';


export const verifyHeaderType = (typ?: unknown) => {
  if (typeof typ === 'undefined') {
    return;
  }

  if (typ !== 'JWT') {
    throw new TokenVerificationError({
      reason: TokenVerificationErrorReason.TokenInvalid,
      message: `Invalid JWT type ${JSON.stringify(typ)}. Expected "JWT".`,
    });
  }
};


export const verifyHeaderKid = (kid?: unknown) => {
  if (typeof kid === 'undefined') {
    return;
  }

  if (typeof kid !== 'string') {
    throw new TokenVerificationError({
      reason: TokenVerificationErrorReason.TokenInvalid,
      message: `Invalid JWT kid ${JSON.stringify(kid)}. Expected a string.`,
    });
  }
};


export const verifyHeaderAlgorithm = (alg: string) => {
  if (!algs.includes(alg)) {
    throw new TokenVerificationError({
      reason: TokenVerificationErrorReason.TokenInvalidAlgorithm,
      message: `Invalid JWT algorithm ${JSON.stringify(alg)}. Supported: ${algs}.`,
    });
  }
};


export const verifySubClaim = (sub?: string) => {
  if (typeof sub !== 'string') {
    throw new TokenVerificationError({
      reason: TokenVerificationErrorReason.TokenVerificationFailed,
      message: `Subject claim (sub) is required and must be a string. Received ${JSON.stringify(sub)}.`,
    });
  }
};