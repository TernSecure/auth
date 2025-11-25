
import type { DecodedIdToken } from '@tern-secure/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAuth } from '../auth';
import { constants } from '../constants';
import { ternDecodeJwt } from '../jwt/verifyJwt';
import { AuthErrorReason, signedIn, signedOut } from '../tokens/authstate';
import type { RequestProcessorContext } from '../tokens/c-authenticateRequestProcessor';
import { createRequestProcessor } from '../tokens/c-authenticateRequestProcessor';
import { authenticateRequest } from '../tokens/request';
import type { AuthenticateRequestOptions } from '../tokens/types';
import { verifyToken } from '../tokens/verify';

vi.mock('../auth');
vi.mock('../jwt/verifyJwt');
vi.mock('../tokens/authstate');
vi.mock('../tokens/c-authenticateRequestProcessor');
vi.mock('../tokens/verify');

const mockedGetAuth = vi.mocked(getAuth);
const mockedTernDecodeJwt = vi.mocked(ternDecodeJwt);
const mockedSignedIn = vi.mocked(signedIn);
const mockedSignedOut = vi.mocked(signedOut);
const mockedCreateRequestProcessor = vi.mocked(createRequestProcessor);
const mockedVerifyToken = vi.mocked(verifyToken);

const mockOptions: AuthenticateRequestOptions = {
  apiKey: 'test-api-key',
};

const request = new Request('https://example.com', { method: 'GET' });

const createDecodedToken = (authTime: number): DecodedIdToken =>
  ({
    auth_time: authTime,
    sub: 'user-id',
    uid: 'user-id',
  } as unknown as DecodedIdToken);

const buildContext = (
  overrides: Partial<RequestProcessorContext> = {},
): RequestProcessorContext =>
  ({
    sessionTokenInHeader: undefined,
    origin: undefined,
    host: undefined,
    forwardedHost: undefined,
    forwardedProto: undefined,
    referrer: undefined,
    userAgent: undefined,
    secFetchDest: undefined,
    accept: undefined,
    idTokenInCookie: undefined,
    refreshTokenInCookie: undefined,
    csrfTokenInCookie: undefined,
    sessionTokenInCookie: undefined,
    customTokenInCookie: undefined,
    ternAuth: 0,
    handshakeNonce: undefined,
    handshakeToken: undefined,
    method: 'GET',
    pathSegments: [],
    ternUrl: new URL('https://example.com'),
    instanceType: 'test',
    session: undefined,
    apiKey: mockOptions.apiKey,
    ...overrides,
  }) as unknown as RequestProcessorContext;

let refreshExpiredIdTokenMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetAllMocks();
  vi.useRealTimers();

  refreshExpiredIdTokenMock = vi.fn().mockResolvedValue({
    data: { idToken: 'new-id-token' },
    error: null,
  });
  mockedGetAuth.mockReturnValue({ refreshExpiredIdToken: refreshExpiredIdTokenMock } as any);

  mockedSignedIn.mockImplementation((context, claims, headers = new Headers(), token) => ({
    isSignedIn: true,
    context,
    claims,
    headers,
    token,
  }) as any);

  mockedSignedOut.mockImplementation((context, reason, message = '', headers = new Headers()) => ({
    isSignedIn: false,
    context,
    reason,
    message,
    headers,
  }) as any);
});

describe('authenticateRequest cookie handling', () => {
  it('signs out when both ternAuth and id token are absent', async () => {
    const context = buildContext({ ternAuth: 0, idTokenInCookie: undefined, refreshTokenInCookie: undefined });
    mockedCreateRequestProcessor.mockReturnValue(context);

    const result = await authenticateRequest(request, mockOptions);

    expect(mockedSignedIn).not.toHaveBeenCalled();
    expect(mockedSignedOut).toHaveBeenCalledWith(context, AuthErrorReason.SessionTokenAndAuthMissing);
    expect(result).toEqual(mockedSignedOut.mock.results[0].value);
  });

  it('signs in locally when ternAuth is missing but id token is present', async () => {
    const authTime = Math.floor(Date.now() / 1000) - 60;
    const context = buildContext({
      ternAuth: 0,
      idTokenInCookie: 'cookie-id-token',
      refreshTokenInCookie: 'refresh-token',
      session: { maxAge: '1h' },
    });
    mockedCreateRequestProcessor.mockReturnValue(context);

    mockedTernDecodeJwt.mockReturnValue({
      data: { payload: { iat: authTime, auth_time: authTime } },
      errors: null,
    } as any);
    mockedVerifyToken.mockResolvedValue({
      data: createDecodedToken(authTime),
      errors: undefined,
    } as any);

    const result = await authenticateRequest(request, mockOptions);

    expect(refreshExpiredIdTokenMock).not.toHaveBeenCalled();
    expect(mockedSignedOut).not.toHaveBeenCalled();
    expect(mockedSignedIn).toHaveBeenCalledTimes(1);
    const headers = mockedSignedIn.mock.calls[0][2] as Headers;
    expect(headers.get('Set-Cookie')).toContain(`${constants.Cookies.TernAut}=${authTime}`);
    expect(result.token).toBe('cookie-id-token');
  });

  it('signs out when ternAuth exists without id token and session check fails', async () => {
    vi.useFakeTimers();
    try {
      const now = Date.now();
      vi.setSystemTime(now);
      const ternAuth = Math.floor((now - 2 * 60 * 60 * 1000) / 1000);
      const context = buildContext({
        ternAuth,
        idTokenInCookie: undefined,
        refreshTokenInCookie: 'refresh-token',
        session: { maxAge: '1h' },
      });
      mockedCreateRequestProcessor.mockReturnValue(context);

      const result = await authenticateRequest(request, mockOptions);

      expect(mockedSignedIn).not.toHaveBeenCalled();
      expect(mockedSignedOut).toHaveBeenCalledWith(
        context,
        AuthErrorReason.AuthTimeout,
        'Authentication expired',
      );
      expect(refreshExpiredIdTokenMock).not.toHaveBeenCalled();
      expect(result).toEqual(mockedSignedOut.mock.results[0].value);
    } finally {
      vi.useRealTimers();
    }
  });

  describe('checkSessionTimeout with 1 hour maxAge', () => {
    it('keeps the session active when auth age is within the limit', async () => {
      vi.useFakeTimers();
      try {
        const now = Date.now();
        vi.setSystemTime(now);
        const ternAuth = Math.floor((now - 30 * 60 * 1000) / 1000);
        const context = buildContext({
          ternAuth,
          idTokenInCookie: 'valid-id',
          refreshTokenInCookie: 'refresh-token',
          session: { maxAge: '1h' },
        });
        mockedCreateRequestProcessor.mockReturnValue(context);

        mockedTernDecodeJwt.mockReturnValue({
          data: { payload: { iat: ternAuth, auth_time: ternAuth } },
          errors: null,
        } as any);
        mockedVerifyToken.mockResolvedValueOnce({
          data: createDecodedToken(ternAuth),
          errors: undefined,
        } as any);

        const result = await authenticateRequest(request, mockOptions);

        expect(mockedSignedOut).not.toHaveBeenCalled();
        expect(mockedSignedIn).toHaveBeenCalledTimes(1);
        expect(result.token).toBe('valid-id');
      } finally {
        vi.useRealTimers();
      }
    });

    it('signs out when auth age exceeds the configured maxAge', async () => {
      vi.useFakeTimers();
      try {
        const now = Date.now();
        vi.setSystemTime(now);
        const ternAuth = Math.floor((now - 75 * 60 * 1000) / 1000);
        const context = buildContext({
          ternAuth,
          idTokenInCookie: 'valid-id',
          refreshTokenInCookie: 'refresh-token',
          session: { maxAge: '1h' },
        });
        mockedCreateRequestProcessor.mockReturnValue(context);

        const result = await authenticateRequest(request, mockOptions);

        expect(mockedSignedIn).not.toHaveBeenCalled();
        expect(mockedSignedOut).toHaveBeenCalledWith(
          context,
          AuthErrorReason.AuthTimeout,
          'Authentication expired',
        );
        expect(mockedVerifyToken).not.toHaveBeenCalled();
        expect(result).toEqual(mockedSignedOut.mock.results[0].value);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it('re-signs without rechecking timeout when token iat is older than ternAuth', async () => {
    vi.useFakeTimers();
    try {
      const now = Date.now();
      vi.setSystemTime(now);
      const ternAuth = Math.floor((now - 30 * 60 * 1000) / 1000);
      const tokenIat = Math.floor((now - 90 * 60 * 1000) / 1000);
      const context = buildContext({
        ternAuth,
        idTokenInCookie: 'stale-id-token',
        refreshTokenInCookie: 'refresh-token',
        session: { maxAge: '1h' },
      });
      mockedCreateRequestProcessor.mockReturnValue(context);

      mockedTernDecodeJwt
        .mockImplementationOnce(() => ({
          data: { payload: { iat: tokenIat, auth_time: tokenIat } },
          errors: null,
        } as any))
        .mockImplementationOnce(() => ({
          data: { payload: { iat: tokenIat, auth_time: tokenIat } },
          errors: null,
        } as any));

      mockedVerifyToken.mockResolvedValueOnce({
        data: createDecodedToken(tokenIat),
        errors: undefined,
      } as any);

      const result = await authenticateRequest(request, mockOptions);

      expect(refreshExpiredIdTokenMock).not.toHaveBeenCalled();
      expect(mockedSignedOut).not.toHaveBeenCalled();
      expect(mockedSignedIn).toHaveBeenCalledTimes(1);
      const headers = mockedSignedIn.mock.calls[0][2] as Headers;
      expect(headers.get('Set-Cookie')).toContain(`${constants.Cookies.TernAut}=${tokenIat}`);
      expect(result.token).toBe('stale-id-token');
    } finally {
      vi.useRealTimers();
    }
  });

  it('throws when local handshake fails to decode the session token', async () => {
    const decodeError = new Error('decode failed');
    mockedTernDecodeJwt.mockReturnValue({ data: null, errors: [decodeError] } as any);
    const context = buildContext({
      ternAuth: 0,
      idTokenInCookie: 'cookie-id-token',
      refreshTokenInCookie: 'refresh-token',
      session: { maxAge: '1h' },
    });
    mockedCreateRequestProcessor.mockReturnValue(context);

    await expect(authenticateRequest(request, mockOptions)).rejects.toBe(decodeError);
    expect(mockedSignedOut).not.toHaveBeenCalled();
    expect(mockedVerifyToken).not.toHaveBeenCalled();
    expect(refreshExpiredIdTokenMock).not.toHaveBeenCalled();
  });
});
