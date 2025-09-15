/**
 * Test suite for CoreApiClient
 * Simple standalone test runner
 */

import { 
  CoreApiClient, 
  NetworkError, 
  TimeoutError, 
  CircuitOpenError, 
  HTTPError,
  ApiResponse 
} from '../instance/coreApiClient';

// Simple test framework
class TestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> }> = [];
  private beforeEachFn?: () => void;
  private currentSuite = '';

  describe(name: string, fn: () => void): void {
    this.currentSuite = name;
    console.log(`\n--- ${name} ---`);
    fn();
  }

  it(name: string, fn: () => Promise<void>): void {
    this.tests.push({ name: `${this.currentSuite}: ${name}`, fn });
  }

  beforeEach(fn: () => void): void {
    this.beforeEachFn = fn;
  }

  async run(): Promise<void> {
    let passed = 0;
    let failed = 0;

    for (const test of this.tests) {
      try {
        if (this.beforeEachFn) this.beforeEachFn();
        await test.fn();
        console.log(`✓ ${test.name}`);
        passed++;
      } catch (error) {
        console.log(`✗ ${test.name}`);
        console.log(`  Error: ${error}`);
        failed++;
      }
    }

    console.log(`\n--- Results ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${passed + failed}`);
  }
}

// Test assertions
function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toEqual: (expected: any) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeNull: () => {
      if (actual !== null) {
        throw new Error(`Expected null, got ${actual}`);
      }
    },
    toContain: (expected: string) => {
      if (!actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    }
  };
}

async function expectToThrow(fn: () => Promise<any>, errorType?: any): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw');
  } catch (error: any) {
    if (errorType && !(error instanceof errorType)) {
      throw new Error(`Expected error of type ${errorType.name}, got ${error.constructor.name}`);
    }
  }
}

// Mock fetch implementation
class MockFetch {
  private responses: Response[] = [];
  private errors: Error[] = [];
  private callCount = 0;
  private calls: Array<{ url: string; init?: RequestInit }> = [];

  constructor() {
    this.reset();
  }

  mockResponse(response: Response): void {
    this.responses.push(response);
  }

  mockError(error: Error): void {
    this.errors.push(error);
  }

  reset(): void {
    this.responses = [];
    this.errors = [];
    this.callCount = 0;
    this.calls = [];
  }

  getCallCount(): number {
    return this.callCount;
  }

  getCalls(): Array<{ url: string; init?: RequestInit }> {
    return this.calls;
  }

  fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    this.callCount++;
    this.calls.push({ url, init });
    
    if (this.errors.length > 0) {
      const error = this.errors.shift()!;
      throw error;
    }

    if (this.responses.length > 0) {
      return this.responses.shift()!;
    }

    // Default successful response
    return new Response('{"response": {}}', { 
      status: 200, 
      headers: { 'content-type': 'application/json' } 
    });
  };
}

// Tests
const runner = new TestRunner();
let client: CoreApiClient;
let mockFetch: MockFetch;

runner.beforeEach(() => {
  mockFetch = new MockFetch();
  client = new CoreApiClient({});
});

runner.describe('CoreApiClient Happy Path', () => {
  runner.it('should make a successful GET request', async () => {
    const mockResponse = new Response('{"response": {"data": "test"}}', {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
    mockFetch.mockResponse(mockResponse);

    const response = await client.request<{ data: string }>({
      path: '/test'
    });

    expect(response.status).toBe(200);
    expect(response.payload?.response.data).toBe('test');
    expect(mockFetch.getCallCount()).toBe(1);
  });

  runner.it('should handle 204 responses with null payload', async () => {
    const mockResponse = new Response(null, { status: 204 });
    mockFetch.mockResponse(mockResponse);

    const response = await client.request({
      path: '/test'
    });

    expect(response.status).toBe(204);
    expect(response.payload).toBeNull();
  });
});

runner.describe('onBeforeRequest hook', () => {
  runner.it('should short-circuit fetch when hook returns false and still run onAfterResponse', async () => {
    let beforeRequestCalled = false;
    let afterResponseCalled = false;

    client.onBeforeRequest(() => {
      beforeRequestCalled = true;
      return false;
    });

    client.onAfterResponse(() => {
      afterResponseCalled = true;
      return true;
    });

    const response = await client.request({
      path: '/test'
    });

    expect(beforeRequestCalled).toBe(true);
    expect(afterResponseCalled).toBe(true);
    expect(response.status).toBe(200);
    expect(response.payload?.response).toEqual({});
    expect(mockFetch.getCallCount()).toBe(0); // No actual fetch should happen
  });
});

runner.describe('Retry logic', () => {
  runner.it('should retry GET requests after transient fetch failures', async () => {
    // First call fails, second succeeds
    mockFetch.mockError(new Error('Network failure'));
    mockFetch.mockResponse(new Response('{"response": {"success": true}}', {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }));

    const response = await client.request<{ success: boolean }>({
      method: 'GET',
      path: '/test'
    }, {
      initialDelay: 10, // Speed up test
      maxTries: 2
    });

    expect(response.status).toBe(200);
    expect(response.payload?.response.success).toBe(true);
    expect(mockFetch.getCallCount()).toBe(2);
  });

  runner.it('should NOT retry non-idempotent methods (POST)', async () => {
    mockFetch.mockError(new Error('Network failure'));

    await expectToThrow(async () => {
      await client.request({
        method: 'POST',
        path: '/test'
      }, {
        maxTries: 3
      });
    }, NetworkError);

    expect(mockFetch.getCallCount()).toBe(1); // Only one attempt
  });
});

runner.describe('Circuit breaker', () => {
  runner.it('should open circuit after failure threshold and throw CircuitOpenError', async () => {
    const failureThreshold = 3;
    client = new CoreApiClient({
      failureThreshold
    });

    // Simulate failures to reach threshold using POST requests (non-retryable)
    for (let i = 0; i < failureThreshold; i++) {
      mockFetch.mockError(new Error('Network failure'));
      try {
        await client.request({ path: '/test', method: 'POST' }); // Use POST so it won't retry
      } catch (error) {
        // Expected to fail with NetworkError
      }
    }

    // Reset mock for next request
    mockFetch.reset();

    // Next request should immediately throw CircuitOpenError
    try {
      await client.request({
        path: '/test'
      });
      throw new Error('Expected CircuitOpenError but no error was thrown');
    } catch (error: any) {
      if (!(error instanceof CircuitOpenError)) {
        throw new Error(`Expected CircuitOpenError, got ${error.constructor.name}: ${error.message}`);
      }
    }
  });
});

runner.describe('URL and method handling', () => {
  runner.it('should encode non-GET/POST methods as _method parameter', async () => {
    await client.request({
      method: 'DELETE',
      path: '/test'
    });

    const calls = mockFetch.getCalls();
    expect(calls.length).toBe(1);
    expect(calls[0].url).toContain('_method=DELETE');
    expect(calls[0].init?.method).toBe('POST');
  });

  runner.it('should build URL correctly with path and search parameters', async () => {
    await client.request({
      path: '/users/123',
      search: { include: 'profile', limit: '10' }
    });

    const calls = mockFetch.getCalls();
    expect(calls[0].url).toBe('https://api.example.com/users/123?include=profile&limit=10');
  });
});

runner.describe('Session handling', () => {
  runner.it('should add authorization header when sessionId is provided', async () => {
    await client.request({
      path: '/test',
      sessionId: 'test-session-123'
    });

    const calls = mockFetch.getCalls();
    const headers = new Headers(calls[0].init?.headers);
    expect(headers.get('authorization')).toBe('Bearer test-session-123');
  });
});

// Run the tests
if (require.main === module) {
  runner.run().catch(console.error);
}

export { runner };
