# CoreApiClient

A robust, FAPI-style HTTP client with reliability features including retry logic, circuit breaker, timeouts, and observability hooks.

## Features

- **Retry Logic**: Automatic retry with jittered exponential backoff for GET requests
- **Circuit Breaker**: Prevents cascading failures by opening circuit after threshold failures
- **Timeouts**: Configurable request timeouts with proper cancellation
- **Observability**: Before/after request hooks for monitoring and metrics
- **Safari Compatibility**: Method tunneling for non-GET/POST requests
- **Form Encoding**: Automatic camelCase to snake_case transformation for form data
- **Session Management**: Built-in session ID handling with Authorization headers

## Basic Usage

```typescript
import { coreApiClient } from '@tern-secure/auth';

// Simple GET request
const response = await coreApiClient.request<{ users: User[] }>({
  path: '/users',
  search: { limit: 10 }
}, {
  apiUrl: 'https://api.example.com'
});

console.log(response.payload?.response.users);
```

## Advanced Usage

```typescript
import { CoreApiClient } from '@tern-secure/auth';

const client = new CoreApiClient({
  apiUrl: 'https://api.example.com',
  timeoutMs: 10000,
  failureThreshold: 5,
  maxTries: 3
});

// Add authentication hook
client.onBeforeRequest(() => {
  const token = localStorage.getItem('auth_token');
  return !!token; // Only proceed if authenticated
});

// Add logging hook
client.onAfterResponse((response) => {
  console.log(`API call completed: ${response.status}`);
  return true;
});

// Make authenticated request
const response = await client.request({
  path: '/protected',
  sessionId: 'user-session-123'
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiUrl` | string | - | Base API URL |
| `frontendApi` | string | - | Alternative base URL |
| `timeoutMs` | number | - | Request timeout in milliseconds |
| `maxTries` | number | 4 (online) / 11 (offline) | Maximum retry attempts |
| `initialDelay` | number | 700 | Initial retry delay in ms |
| `factor` | number | 2 | Exponential backoff factor |
| `maxDelay` | number | 5000 | Maximum retry delay in ms |
| `failureThreshold` | number | 5 | Circuit breaker failure threshold |
| `recoveryTimeoutMs` | number | 60000 | Circuit breaker recovery timeout |
| `fetchImpl` | function | fetch | Custom fetch implementation |

## Response Format

All responses are augmented with a `payload` property:

```typescript
interface ApiResponse<T> extends Response {
  payload: {
    response: T;
    client?: any;
    errors?: any[];
    meta?: any;
  } | null;
}
```

## Error Handling

The client throws typed errors for different failure scenarios:

- `NetworkError`: Network/connection failures
- `TimeoutError`: Request timeouts
- `CircuitOpenError`: Circuit breaker is open
- `HTTPError`: HTTP error responses

## Method Tunneling

For Safari compatibility, non-GET/POST methods are automatically tunneled:

```typescript
// This request:
await client.request({
  method: 'DELETE',
  path: '/users/123'
});

// Becomes:
// POST /users/123?_method=DELETE
```

## Form Data Transformation

Object bodies are automatically transformed to form-encoded data with snake_case keys:

```typescript
await client.request({
  method: 'POST',
  body: {
    firstName: 'John',
    emailAddress: 'john@example.com'
  }
});

// Body becomes: "first_name=John&email_address=john%40example.com"
```

## Testing

The client includes comprehensive tests covering:

- Happy path scenarios
- Hook behavior (before/after request)
- Retry logic for different HTTP methods
- Circuit breaker functionality
- URL building and method tunneling
- Session handling

Run tests with:
```bash
npx tsx src/instance/coreApiClient.test.ts
```

## Implementation Notes

- Uses `AbortController` for proper request cancellation
- Implements conservative defaults for reliability
- Prefers explicit `apiUrl` over `frontendApi` when both are provided
- Handles 204 responses specially (null payload)
- Circuit breaker uses deterministic consecutive failure counting
- Full jitter applied to retry delays to prevent thundering herd
