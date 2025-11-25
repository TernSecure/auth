import type { AuthErrorResponse, ErrorCode } from "@tern-secure/types";


export class TernSecureError extends Error {
  code: ErrorCode

  constructor(code: ErrorCode, message?: string) {
    super(message || code)
    this.name = "TernSecureError"
    this.code = code
  }
}


/**
 * Handles Firebase authentication errors with multiple fallback mechanisms
 */
export function handleFirebaseAuthError(error: unknown): AuthErrorResponse {
  function extractErrorInfo(input: unknown): { code: string; message: string } | null {
    // Case 1: String input (direct Firebase error message)
    if (typeof input === 'string') {
      const match = input.match(/Firebase:\s*Error\s*\(auth\/([^)]+)\)/);
      if (match) {
        return { code: match[1], message: input };
      }
    }

    // Case 2: Error object
    if (input && typeof input === 'object') {
      const err = input as { code?: string; message?: string };
      
      // Check for bundled message format first
      if (err.message) {
        const match = err.message.match(/Firebase:\s*Error\s*\(auth\/([^)]+)\)/);
        if (match) {
          return { code: match[1], message: err.message };
        }
      }

      // Check for direct code
      if (err.code) {
        return {
          code: err.code.replace('auth/', ''),
          message: err.message || ''
        };
      }
    }

    return null;
  }

  // Map error codes to user-friendly messages
  const ERROR_MESSAGES: Record<string, { message: string; code: ErrorCode }> = {
    'argument-error': { message: 'Method called with incorrect arguments', code: 'INCORRECT_ARGUMENT' },
    'invalid-email': { message: 'Invalid email format', code: 'INVALID_EMAIL' },
    'invalid-tenant-id': { message: 'Invalid tenant ID', code: 'INVALID_ARGUMENT' },
    'invalid-credential': { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
    'invalid-login-credentials': { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
    'wrong-password': { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
    'user-not-found': { message: 'User not found', code: 'USER_NOT_FOUND' },
    'user-disabled': { message: 'This account has been disabled', code: 'USER_DISABLED' },
    'too-many-requests': { message: 'Too many attempts. Please try again later', code: 'TOO_MANY_ATTEMPTS' },
    'network-request-failed': { message: 'Network error. Please check your connection', code: 'NETWORK_ERROR' },
    'email-already-in-use': { message: 'This email is already in use', code: 'EMAIL_EXISTS' },
    'weak-password': { message: 'Password is too weak', code: 'WEAK_PASSWORD' },
    'operation-not-allowed': { message: 'This login method is not enabled', code: 'OPERATION_NOT_ALLOWED' },
    'popup-blocked': { message: 'Login popup was blocked. Please enable popups', code: 'POPUP_BLOCKED' },
    'expired-action-code': { message: 'Your session has expired. Please login again', code: 'EXPIRED_TOKEN' },
    'user-token-expired': { message: 'Your session has expired. Please login again', code: 'EXPIRED_TOKEN' },
    'tenant-not-found': { message: 'There is no tenant corresponding to the provided identifier.', code: 'INVALID_ARGUMENT' },
  };

  try {
    // Extract error information
    const errorInfo = extractErrorInfo(error);
    
    if (errorInfo) {
      const mappedError = ERROR_MESSAGES[errorInfo.code];
      if (mappedError) {
        return {
          success: false,
          message: mappedError.message,
          code: mappedError.code
        };
      }
    }

    // If we couldn't extract or map the error, try one last time with string conversion
    const errorString = String(error);
    const lastMatch = errorString.match(/Firebase:\s*Error\s*\(auth\/([^)]+)\)/);
    if (lastMatch && ERROR_MESSAGES[lastMatch[1]]) {
      return {
        success: false,
        ...ERROR_MESSAGES[lastMatch[1]]
      };
    }

  } catch (e) {
    // Silent catch - we'll return the default error
  }

  // Default fallback
  return {
    success: false,
    message: 'An unexpected error occurred. Please try again later',
    code: 'INTERNAL_ERROR'
  };
}

/**
 * Type guard to check if a response is an AuthErrorResponse
 */
export function isAuthErrorResponse(response: unknown): response is AuthErrorResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    (response as { success: boolean }).success === false &&
    "code" in response &&
    "message" in response
  )
}

export function getErrorAlertVariant(error: any | undefined) {
 if (!error) return "destructive"

  switch (error.error) {
    case "AUTHENTICATED":
      return "default"
    case "EMAIL_EXISTS":
    case "UNAUTHENTICATED":
    case "UNVERIFIED":
    case "REQUIRES_VERIFICATION":
    case "INVALID_EMAIL":
    case "INVALID_TOKEN":
    case "INTERNAL_ERROR":
    case "USER_DISABLED":
    case "TOO_MANY_ATTEMPTS":
    case "NETWORK_ERROR":
    case "SESSION_EXPIRED":
    case "EXPIRED_TOKEN":
    case "INVALID_CREDENTIALS":
    default:
      return "destructive"
  }
}