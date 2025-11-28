import type { JWTPayload } from '@tern-secure/types';


export type JwtReturnType<R, E extends Error> =
  | {
      data: R;
      errors?: undefined;
    }
  | {
      data?: undefined;
      errors: [E];
    };


export const ALGORITHM_RS256 = 'RS256' as const;

export interface CryptoSigner {
    getAccountId(): Promise<string>;
    sign(payload: JWTPayload): Promise<string>;
}