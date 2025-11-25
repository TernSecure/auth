import { camelToSnake, jitteredDelay } from '@tern-secure/shared/caseUtils'
import type { InstanceType, TernSecureApiErrorJSON } from '@tern-secure/types';

import { buildURL as buildUrlUtil, stringifyQueryParams } from '../utils';

export type HTTPMethod =
  | 'CONNECT'
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT'
  | 'TRACE';

export type ApiRequestInit = RequestInit & {
  path?: string;
  search?: ConstructorParameters<typeof URLSearchParams>[0];
  sessionId?: string;
  pathPrefix?: string;
  url?: URL;
};

export interface ApiResponseJSON<T> {
  response: T;
  errors?: TernSecureApiErrorJSON[];
}

export type ApiResponse<T> = Response & { payload: ApiResponseJSON<T> | null };

export type ApiRequestCallback<T> = (request: ApiRequestInit, response?: ApiResponse<T>) => unknown;

export interface ApiRequestOptions {
  timeoutMs?: number;
  maxTries?: number;
  initialDelay?: number;
  factor?: number;
  maxDelay?: number;
  failureThreshold?: number;
  recoveryTimeoutMs?: number;
}

export interface ApiClientOptions {
  authDomain?: string;
  apiUrl?: string;
  frontendApi?: string;
  instanceType?: InstanceType;
  apiBasePath?: string;
}

export interface ApiClient {
  onBeforeRequest: (hook: BeforeRequestHook) => void;
  onAfterResponse: (hook: AfterResponseHook) => void;
  request: <T>(init: ApiRequestInit, opts?: ApiRequestOptions) => Promise<ApiResponse<T>>;
}

export type BeforeRequestHook = () => boolean | Promise<boolean>;
export type AfterResponseHook = (response: ApiResponse<any>) => boolean | Promise<boolean>;

// Error classes
export class NetworkError extends Error {
  constructor(
    public url: string,
    public original: Error,
  ) {
    super(`Network error for ${url}: ${original.message}`);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor() {
    super('Request timed out');
    this.name = 'TimeoutError';
  }
}

export class CircuitOpenError extends Error {
  constructor() {
    super('Circuit breaker is open');
    this.name = 'CircuitOpenError';
  }
}

export class HTTPError extends Error {
  constructor(
    public status: number,
    public url: string,
    public body?: any,
  ) {
    super(`HTTP ${status} error for ${url}`);
    this.name = 'HTTPError';
  }
}

// Circuit breaker state interface
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

// Client state interface
interface ClientState {
  circuitBreaker: CircuitBreakerState;
  beforeRequestHooks: BeforeRequestHook[];
  afterResponseHooks: AfterResponseHook[];
  clientOptions: ApiClientOptions;
}

function createInitialState(clientOptions: ApiClientOptions = {}): ClientState {
  return {
    circuitBreaker: {
      failures: 0,
      lastFailureTime: 0,
      state: 'closed',
    },
    beforeRequestHooks: [],
    afterResponseHooks: [],
    clientOptions,
  };
}

function addBeforeRequestHook(state: ClientState, hook: BeforeRequestHook): void {
  state.beforeRequestHooks.push(hook);
}

function addAfterResponseHook(state: ClientState, hook: AfterResponseHook): void {
  state.afterResponseHooks.push(hook);
}

async function runBeforeRequestHooks(state: ClientState): Promise<boolean> {
  for (const hook of state.beforeRequestHooks) {
    const result = await hook();
    if (result === false) return false;
  }
  return true;
}

async function runAfterResponseHooks(
  state: ClientState,
  response: ApiResponse<any>,
): Promise<void> {
  for (const hook of state.afterResponseHooks) {
    await hook(response);
  }
}

function checkCircuitBreaker(state: ClientState, requestOptions: ApiRequestOptions): void {
  const { recoveryTimeoutMs = 60000 } = requestOptions;
  const now = Date.now();

  if (state.circuitBreaker.state === 'open') {
    if (now - state.circuitBreaker.lastFailureTime >= recoveryTimeoutMs) {
      state.circuitBreaker.state = 'half-open';
    } else {
      throw new CircuitOpenError();
    }
  }
}

function recordSuccess(state: ClientState): void {
  state.circuitBreaker.failures = 0;
  state.circuitBreaker.state = 'closed';
}

function recordFailure(state: ClientState, requestOptions: ApiRequestOptions): void {
  const { failureThreshold = 5 } = requestOptions;
  state.circuitBreaker.failures++;
  state.circuitBreaker.lastFailureTime = Date.now();

  if (state.circuitBreaker.failures >= failureThreshold) {
    state.circuitBreaker.state = 'open';
  }
}

function shouldRetry(
  state: ClientState,
  requestOptions: ApiRequestOptions,
  error: any,
  method: string,
  attempt: number,
  maxTries: number,
): boolean {
  const isRetryable =
    error instanceof NetworkError && method.toUpperCase() === 'GET' && attempt < maxTries;

  if (!isRetryable) {
    recordFailure(state, requestOptions);
  }

  return isRetryable;
}

async function retryWithBackoff<T>(
  state: ClientState,
  requestOptions: ApiRequestOptions,
  attemptFn: () => Promise<T>,
  shouldRetryFn: (error: any, attempt: number) => boolean,
): Promise<T> {
  const {
    initialDelay = 700,
    factor = 2,
    maxDelay = 5000,
    maxTries = typeof navigator !== 'undefined' && navigator.onLine ? 4 : 11,
  } = requestOptions;

  let lastError: any;

  for (let attempt = 1; attempt <= maxTries; attempt++) {
    try {
      const result = await attemptFn();
      recordSuccess(state);
      return result;
    } catch (error) {
      lastError = error;

      if (!shouldRetryFn(error, attempt)) {
        throw error;
      }

      recordFailure(state, requestOptions);

      if (attempt < maxTries) {
        const delay = Math.min(initialDelay * Math.pow(factor, attempt - 1), maxDelay);
        await new Promise(resolve => setTimeout(resolve, jitteredDelay(delay)));
      }
    }
  }

  throw lastError;
}

export function createCoreApiClient(clientOptions: ApiClientOptions): ApiClient {
  function buildUrl(requestInit: ApiRequestInit): URL {
    const isLocalhost = clientOptions.apiUrl?.includes('localhost') || clientOptions.apiUrl?.includes('127.0.0.1');
    const { path } = requestInit;
    const { instanceType, authDomain, apiUrl, apiBasePath = '/api/auth' } = clientOptions;
    const domainInProd = instanceType === 'production' ? authDomain : '';

    let baseUrl: string;
    if (isLocalhost) {
      // For localhost, use http and the apiUrl directly
      baseUrl = apiUrl?.startsWith('http') ? apiUrl : `http://${apiUrl}`;
    } else {
      //const domainInProd = instanceType === 'production' ? domain : '';
      baseUrl = `https://${domainInProd || apiUrl}`;
    }

    const fullPath = `${apiBasePath}/${path}`.replace(/\/+/g, '/'); 
    return buildUrlUtil(
      {
        base: baseUrl,
        pathname: fullPath,
        searchParams: requestInit.search ? new URLSearchParams(requestInit.search) : undefined,
      },
      { stringify: false },
    );
  }

  async function makeRequest<T>(
    state: ClientState,
    init: ApiRequestInit,
    opts: ApiRequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const requestInit = { ...init };
    const { method = 'GET', body } = requestInit;
    const requestOptions = { ...opts };

    requestInit.url = buildUrl({ ...requestInit });
    checkCircuitBreaker(state, requestOptions);

    const shouldContinue = await runBeforeRequestHooks(state);
    if (!shouldContinue) {
      const mockResponse = new Response('{}', {
        status: 200,
      }) as ApiResponse<T>;
      mockResponse.payload = { response: {} as T };
      await runAfterResponseHooks(state, mockResponse);
      return mockResponse;
    }

    const { timeoutMs } = requestOptions;

    const overwrittenRequestMethod = method === 'GET' ? 'GET' : 'POST';
    const url = requestInit.url.toString();

    requestInit.headers = new Headers(requestInit.headers);

    if (
      method !== 'GET' &&
      !(body instanceof FormData) &&
      !requestInit.headers.has('content-type')
    ) {
      requestInit.headers.set('content-type', 'application/json');
    }

    if (requestInit.headers.get('content-type') === 'application/x-www-form-urlencoded') {
      requestInit.body = body
        ? stringifyQueryParams(body as any as Record<string, string>, {
            keyEncoder: camelToSnake,
          })
        : body;
    } else if (requestInit.headers.get('content-type') === 'application/json' && body) {
      requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const attemptRequest = async (): Promise<ApiResponse<T>> => {
      const controller = new AbortController();
      const timeoutId = timeoutMs
        ? setTimeout(() => {
            controller.abort();
          }, timeoutMs)
        : null;

      let response: Response;
      const fetchOpts: ApiRequestInit = {
        ...requestInit,
        credentials: 'include',
        method: overwrittenRequestMethod,
      };

      try {
        response = await fetch(url, fetchOpts);

        if (timeoutId) clearTimeout(timeoutId);

        let payload: ApiResponseJSON<T> | null = null;

        if (response.status === 204) {
          payload = null;
        } else {
          try {
            const json = await response.json();
            payload = json;
          } catch {
            payload = { response: {} as T };
          }
        }

        const apiResponse = response as ApiResponse<T>;
        apiResponse.payload = payload;

        await runAfterResponseHooks(state, apiResponse);

        return apiResponse;
      } catch (error: any) {
        if (timeoutId) clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          throw new TimeoutError();
        }

        throw new NetworkError(url, error);
      }
    };

    return retryWithBackoff(state, requestOptions, attemptRequest, (error, attempt) =>
      shouldRetry(
        state,
        requestOptions,
        error,
        overwrittenRequestMethod,
        attempt,
        requestOptions.maxTries || (typeof navigator !== 'undefined' && navigator.onLine ? 4 : 11),
      ),
    );
  }
  const state = createInitialState(clientOptions);

  return {
    onBeforeRequest: (hook: BeforeRequestHook) => addBeforeRequestHook(state, hook),
    onAfterResponse: (hook: AfterResponseHook) => addAfterResponseHook(state, hook),
    request: <T>(init: ApiRequestInit, opts: ApiRequestOptions = {}) =>
      makeRequest<T>(state, init, opts),
  };
}
