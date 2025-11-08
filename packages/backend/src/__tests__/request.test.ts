
import type { DecodedIdToken } from '@tern-secure/types';
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import { getAuth } from '../auth';
import { constants } from '../constants';
import { ternDecodeJwt } from '../jwt/verifyJwt';
import { TokenVerificationError, TokenVerificationErrorReason } from '../utils/errors';
import { AuthErrorReason, signedIn, signedOut } from '../tokens/authstate';
import type { RequestProcessorContext } from '../tokens/c-authenticateRequestProcessor';
import { createRequestProcessor } from '../tokens/c-authenticateRequestProcessor';
import { authenticateRequest } from '../tokens/request';
import type { AuthenticateRequestOptions } from '../tokens/types';
import { verifyToken } from '../tokens/verify';

vi.mock('../auth');
vi.mock('../jwt/verifyJwt');
vi.mock('./authstate');
vi.mock('./c-authenticateRequestProcessor');
vi.mock('./verify');

const mockedGetAuth = vi.mocked(getAuth);
const mockedTernDecodeJwt = vi.mocked(ternDecodeJwt);
const mockedSignedIn = vi.mocked(signedIn);
const mockedSignedOut = vi.mocked(signedOut);
const mockedCreateRequestProcessor = vi.mocked(createRequestProcessor);
const mockedVerifyToken = vi.mocked(verifyToken);

const mockOptions: AuthenticateRequestOptions = {
  apiKey: 'test-api-key',
};

const createDecodedToken = (authTime: number): DecodedIdToken =>
  ({
    auth_time: authTime,
    sub: 'user-id',
    uid: 'user-id',
  } as unknown as DecodedIdToken);

describe('authenticateRequest re-sign and refresh logic', () => {
  const idToken = 'valid-id-token';
  const refreshToken = 'valid-refresh-token';
  const request = new Request('https://example.com', { method: 'GET' });
  const ternUrl = new URL('https://example.com');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();

    mockedGetAuth.mockReturnValue({
      refreshExpiredIdToken: vi.fn().mockResolvedValue({
        data: { idToken: 'new-id-token' },
        error: null,
      }),
    } as any);

    mockedVerifyToken.mockImplementation((token) => {
      const payload = createDecodedToken(Math.floor(Date.now() / 1000));
      return Promise.resolve({ data: payload });
    });

    mockedTernDecodeJwt.mockReturnValue({
      data: { payload: { iat: 0, auth_time: 0 } },
      errors: null,
    } as any);

    mockedSignedIn.mockImplementation((context, claims, headers, token) => ({
      isKnown: true,
      isSignedIn: true,
      reason: 'signed-in',
      message: '',
      context,
      token,
      headers,
      claims,
    } as any));

    mockedSignedOut.mockImplementation((context, reason, message) => ({
      isKnown: false,
      isSignedIn: false,
      reason: reason || 'signed-out',
      message: message || '',
      context,
    } as any));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('session.maxAge scenarios', () => {
    describe('when session.maxAge is 5 minutes (less than token lifetime)', () => {
      const maxAge = 5 * 60 * 1000;

      it('should result in signedIn when auth age is less than maxAge', async () => {
        const now = Date.now();
        vi.setSystemTime(now);
        const ternAuth = Math.floor((now - 4 * 60 * 1000) / 1000); // 4 minutes ago

        mockedCreateRequestProcessor.mockReturnValue({
          idTokenInCookie: idToken,
          refreshTokenInCookie: refreshToken,
          ternAuth,
          session: { maxAge },
          ternUrl,
        } as unknown as RequestProcessorContext);
        mockedTernDecodeJwt.mockReturnValue({
          data: { payload: { iat: ternAuth, auth_time: ternAuth } },
        } as any);
  mockedVerifyToken.mockResolvedValue({ data: createDecodedToken(ternAuth) });

        await authenticateRequest(request, mockOptions);

        expect(mockedSignedOut).not.toHaveBeenCalled();
        expect(mockedSignedIn).toHaveBeenCalled();
      });

      it('should sign out when auth age exceeds maxAge, without refresh attempt', async () => {
        const now = Date.now();
        vi.setSystemTime(now);
        const ternAuth = Math.floor((now - 6 * 60 * 1000) / 1000); // 6 minutes ago

        mockedCreateRequestProcessor.mockReturnValue({
          idTokenInCookie: idToken,
          refreshTokenInCookie: refreshToken,
          ternAuth,
          session: { maxAge },
          ternUrl,
        } as unknown as RequestProcessorContext);

        await authenticateRequest(request, mockOptions);

        expect(mockedSignedIn).not.toHaveBeenCalled();
        expect(mockedSignedOut).toHaveBeenCalledWith(
          expect.anything(),
          AuthErrorReason.SessionTokenExpired,
          expect.any(String),
        );
      });
    });

    describe('when session.maxAge is 60 minutes (same as token lifetime)', () => {
      const maxAge = 60 * 60 * 1000;

      it('should result in signedIn if token is not expired', async () => {
        const now = Date.now();
        vi.setSystemTime(now);
        const ternAuth = Math.floor((now - 59 * 60 * 1000) / 1000); // 59 minutes ago

        mockedCreateRequestProcessor.mockReturnValue({
          idTokenInCookie: idToken,
          refreshTokenInCookie: refreshToken,
          ternAuth,
          session: { maxAge },
          ternUrl,
        } as unknown as RequestProcessorContext);
        mockedTernDecodeJwt.mockReturnValue({
          data: { payload: { iat: ternAuth, auth_time: ternAuth } },
        } as any);
  mockedVerifyToken.mockResolvedValue({ data: createDecodedToken(ternAuth) });

        await authenticateRequest(request, mockOptions);

        expect(mockedSignedOut).not.toHaveBeenCalled();
        expect(mockedSignedIn).toHaveBeenCalled();
      });

      it('should refresh token if token is expired, but auth age is within maxAge', async () => {
        const now = Date.now();
        vi.setSystemTime(now);
        const ternAuth = Math.floor((now - 59 * 60 * 1000) / 1000); // 59 mins ago
        const tokenIat = Math.floor((now - 61 * 60 * 1000) / 1000); // 61 mins ago, so expired

        mockedCreateRequestProcessor.mockReturnValue({
          idTokenInCookie: idToken,
          refreshTokenInCookie: refreshToken,
          ternAuth,
          session: { maxAge },
          ternUrl,
        } as unknown as RequestProcessorContext);
        mockedTernDecodeJwt.mockReturnValue({
          data: { payload: { iat: tokenIat, auth_time: ternAuth } },
        } as any);
        mockedVerifyToken.mockImplementation((tokenToVerify) => {
          if (tokenToVerify === idToken) {
            throw new TokenVerificationError({
              message: 'Token expired',
              reason: TokenVerificationErrorReason.TokenExpired,
            });
          }
          if (tokenToVerify === 'new-id-token') {
            return Promise.resolve({ data: createDecodedToken(Math.floor(Date.now() / 1000)) });
          }
          return Promise.resolve({
            errors: [
              new TokenVerificationError({
                message: 'unexpected token',
                reason: TokenVerificationErrorReason.TokenVerificationFailed,
              }),
            ],
          });
        });
        const refreshMock = vi.fn().mockResolvedValue({
          data: { idToken: 'new-id-token' },
          error: null,
        });
        mockedGetAuth.mockReturnValue({ refreshExpiredIdToken: refreshMock } as any);

        const result = await authenticateRequest(request, mockOptions);

        expect(refreshMock).toHaveBeenCalled();
        expect(mockedSignedOut).not.toHaveBeenCalled();
        expect(mockedSignedIn).toHaveBeenCalled();
        expect(result.token).toBe('new-id-token');
      });
    });

    describe('when session.maxAge is 70 minutes (longer than token lifetime)', () => {
      const maxAge = 70 * 60 * 1000;

      it('should refresh token if token is expired and auth age is within maxAge', async () => {
        const now = Date.now();
        vi.setSystemTime(now);
        const ternAuth = Math.floor((now - 65 * 60 * 1000) / 1000); // 65 mins ago
        const tokenIat = Math.floor((now - 61 * 60 * 1000) / 1000); // 61 mins ago, so expired

        mockedCreateRequestProcessor.mockReturnValue({
          idTokenInCookie: idToken,
          refreshTokenInCookie: refreshToken,
          ternAuth,
          session: { maxAge },
          ternUrl,
        } as unknown as RequestProcessorContext);
        mockedTernDecodeJwt.mockReturnValue({
          data: { payload: { iat: tokenIat, auth_time: ternAuth } },
        } as any);
        mockedVerifyToken.mockImplementation((tokenToVerify) => {
          if (tokenToVerify === idToken) {
            throw new TokenVerificationError({
              message: 'Token expired',
              reason: TokenVerificationErrorReason.TokenExpired,
            });
          }
          if (tokenToVerify === 'new-id-token') {
            return Promise.resolve({ data: createDecodedToken(Math.floor(Date.now() / 1000)) });
          }
          return Promise.resolve({
            errors: [
              new TokenVerificationError({
                message: 'unexpected token',
                reason: TokenVerificationErrorReason.TokenVerificationFailed,
              }),
            ],
          });
        });
        const refreshMock = vi.fn().mockResolvedValue({
          data: { idToken: 'new-id-token' },
          error: null,
        });
        mockedGetAuth.mockReturnValue({ refreshExpiredIdToken: refreshMock } as any);

        const result = await authenticateRequest(request, mockOptions);

        expect(refreshMock).toHaveBeenCalled();
        expect(mockedSignedOut).not.toHaveBeenCalled();
        expect(mockedSignedIn).toHaveBeenCalled();
        expect(result.token).toBe('new-id-token');
      });

      it('should sign out if auth age exceeds maxAge', async () => {
        const now = Date.now();
        vi.setSystemTime(now);
        const ternAuth = Math.floor((now - 71 * 60 * 1000) / 1000); // 71 minutes ago

        mockedCreateRequestProcessor.mockReturnValue({
          idTokenInCookie: idToken,
          refreshTokenInCookie: refreshToken,
          ternAuth,
          session: { maxAge },
          ternUrl,
        } as unknown as RequestProcessorContext);

        await authenticateRequest(request, mockOptions);

        expect(mockedSignedIn).not.toHaveBeenCalled();
        expect(mockedSignedOut).toHaveBeenCalledWith(
          expect.anything(),
          AuthErrorReason.SessionTokenExpired,
          expect.any(String),
        );
      });
    });
  });

  describe('Re-sign (handleLocalHandshake) trigger', () => {
    it('should trigger "re-sign" if token iat is before ternAuth', async () => {
      const now = Date.now();
      vi.setSystemTime(now);
      const newerTernAuth = Math.floor((now - 5 * 60 * 1000) / 1000); // 5 mins ago
      const olderTokenIat = Math.floor((now - 10 * 60 * 1000) / 1000); // 10 mins ago

      mockedCreateRequestProcessor.mockReturnValue({
        idTokenInCookie: idToken,
        refreshTokenInCookie: refreshToken,
        ternAuth: newerTernAuth,
        session: { maxAge: 60 * 60 * 1000 },
        ternUrl,
      } as unknown as RequestProcessorContext);
      mockedTernDecodeJwt.mockReturnValue({
        data: { payload: { iat: olderTokenIat, auth_time: olderTokenIat } },
      } as any);
  mockedVerifyToken.mockResolvedValue({ data: createDecodedToken(olderTokenIat) });

      await authenticateRequest(request, mockOptions);

      expect(mockedSignedIn).toHaveBeenCalled();
      const signedInCallArgs = mockedSignedIn.mock.calls[0];
      const headers = signedInCallArgs[2] as Headers;
      expect(headers.get('Set-Cookie')).toContain(`${constants.Cookies.TernAut}=${olderTokenIat}`);
    });
  });
});
