import type { TernSecureAPIError, TernSecureApiErrorJSON } from '@tern-secure/types';

import { stringifyQueryParams, buildURL as buildUrlUtil } from '../utils';

export type HTTPMethod = 'CONNECT' | 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT' | 'TRACE';

export type ApiRequestInit = RequestInit & {
  path?: string;
  search?: ConstructorParameters<typeof URLSearchParams>[0];
  sessionId?: string;
  url?: URL;
};

export interface ApiResponseJSON<T> {
  response: T;
  errors?: TernSecureApiErrorJSON[];
}

export type ApiResponse<T> = Response & { payload: ApiResponseJSON<T> | null };

export type ApiRequestCallback<T> = (request: ApiRequestInit, response?: ApiResponse<T>) => unknown;

export interface RequestOptions {
  timeoutMs?: number;
  maxTries?: number;
  initialDelay?: number;
  factor?: number;
  maxDelay?: number;
  failureThreshold?: number;
  recoveryTimeoutMs?: number;
  apiUrl?: string;
  frontendApi?: string;
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

// Circuit breaker state
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

// Utility functions
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function jitteredDelay(delay: number): number {
  return delay * Math.random();
}

function buildUrl(requestInit: ApiRequestInit, options: RequestOptions): URL {
  const { path } = requestInit;
  const baseUrl = options.apiUrl;

  if (!baseUrl) {
    throw new Error('API URL is required');
  }

  // Ensure proper URL construction by joining baseUrl and path
  const fullPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  const fullUrl = baseUrl.replace(/\/$/, '') + fullPath;

  return buildUrlUtil(
    {
      base: fullUrl,
      searchParams: requestInit.search ? new URLSearchParams(requestInit.search) : undefined
    },
    { stringify: false },
  );
}

export class CoreApiClient {
  private circuitBreaker: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    state: 'closed',
  };

  private beforeRequestHooks: BeforeRequestHook[] = [];
  private afterResponseHooks: AfterResponseHook[] = [];

  constructor(private options: RequestOptions = {}) {}

  onBeforeRequest(hook: BeforeRequestHook): void {
    this.beforeRequestHooks.push(hook);
  }

  onAfterResponse(hook: AfterResponseHook): void {
    this.afterResponseHooks.push(hook);
  }

  private async runBeforeRequestHooks(): Promise<boolean> {
    for (const hook of this.beforeRequestHooks) {
      const result = await hook();
      if (result === false) return false;
    }
    return true;
  }

  private async runAfterResponseHooks(response: ApiResponse<any>): Promise<void> {
    for (const hook of this.afterResponseHooks) {
      await hook(response);
    }
  }

  private checkCircuitBreaker(): void {
    const { recoveryTimeoutMs = 60000 } = this.options;
    const now = Date.now();

    if (this.circuitBreaker.state === 'open') {
      if (now - this.circuitBreaker.lastFailureTime >= recoveryTimeoutMs) {
        this.circuitBreaker.state = 'half-open';
      } else {
        throw new CircuitOpenError();
      }
    }
  }

  private recordSuccess(): void {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'closed';
  }

  private recordFailure(): void {
    const { failureThreshold = 5 } = this.options;
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= failureThreshold) {
      this.circuitBreaker.state = 'open';
    }
  }

  private shouldRetry(error: any, method: string, attempt: number, maxTries: number): boolean {
    // Only retry on network errors for GET requests
    const isRetryable = error instanceof NetworkError && method.toUpperCase() === 'GET' && attempt < maxTries;

    // If not retrying, we should still record the failure for circuit breaker
    if (!isRetryable) {
      this.recordFailure();
    }

    return isRetryable;
  }

  private async retryWithBackoff<T>(
    attemptFn: () => Promise<T>,
    shouldRetry: (error: any, attempt: number) => boolean,
  ): Promise<T> {
    const {
      initialDelay = 700,
      factor = 2,
      maxDelay = 5000,
      maxTries = typeof navigator !== 'undefined' && navigator.onLine ? 4 : 11,
    } = this.options;

    let lastError: any;

    for (let attempt = 1; attempt <= maxTries; attempt++) {
      try {
        const result = await attemptFn();
        this.recordSuccess();
        return result;
      } catch (error) {
        lastError = error;

        if (!shouldRetry(error, attempt)) {
          // shouldRetry already recorded the failure, so just throw
          throw error;
        }

        // This is a retryable error, record failure for circuit breaker
        this.recordFailure();

        if (attempt < maxTries) {
          const delay = Math.min(initialDelay * Math.pow(factor, attempt - 1), maxDelay);
          await new Promise(resolve => setTimeout(resolve, jitteredDelay(delay)));
        }
      }
    }

    throw lastError;
  }

  async request<T>(init: ApiRequestInit, opts: RequestOptions = {}): Promise<ApiResponse<T>> {
    const requestInit = { ...init };
    const { method = 'GET', body } = requestInit;

    const c = (requestInit.url = buildUrl({ ...init }, { ...opts }));
    console.log('Built URL:', c);

    requestInit.url = buildUrl({ ...init }, { ...opts });
    // Check circuit breaker
    this.checkCircuitBreaker();

    // Run before request hooks
    const shouldContinue = await this.runBeforeRequestHooks();
    if (!shouldContinue) {
      const mockResponse = new Response('{}', {
        status: 200,
      }) as ApiResponse<T>;
      mockResponse.payload = { response: {} as T };
      await this.runAfterResponseHooks(mockResponse);
      return mockResponse;
    }

    const mergedOptions = { ...opts };
    const { timeoutMs } = mergedOptions;

    // Safari workaround - only use GET/POST
    const overwrittenRequestMethod = method === 'GET' ? 'GET' : 'POST';

    const url = requestInit.url.toString();

    console.log('Request URL:', url);

    requestInit.headers = new Headers(requestInit.headers);

    // Set the default content type for non-GET requests.
    if (method !== 'GET' && !(body instanceof FormData) && !requestInit.headers.has('content-type')) {
      requestInit.headers.set('content-type', 'application/json');
    }

    if (requestInit.headers.get('content-type') === 'application/x-www-form-urlencoded') {
      requestInit.body = body
        ? stringifyQueryParams(body as any as Record<string, string>, { keyEncoder: camelToSnake })
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

        // Parse response
        let payload: ApiResponseJSON<T> | null = null;

        if (response.status === 204) {
          payload = null;
        } else {
          try {
            const json = await response.json();
            payload = json;
          } catch {
            // If JSON parsing fails, create default payload
            payload = { response: {} as T };
          }
        }

        const apiResponse = response as ApiResponse<T>;
        apiResponse.payload = payload;

        // Run after response hooks
        await this.runAfterResponseHooks(apiResponse);

        return apiResponse;
      } catch (error: any) {
        if (timeoutId) clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          throw new TimeoutError();
        }

        throw new NetworkError(url, error);
      }
    };

    return this.retryWithBackoff(attemptRequest, (error, attempt) =>
      this.shouldRetry(
        error,
        overwrittenRequestMethod,
        attempt,
        mergedOptions.maxTries || (typeof navigator !== 'undefined' && navigator.onLine ? 4 : 11),
      ),
    );
  }
}

// Default instance
export const coreApiClient = new CoreApiClient();
