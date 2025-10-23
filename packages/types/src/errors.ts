
export type AuthErrorCode = keyof typeof ERRORS

export type ErrorCode = keyof typeof ERRORS


export const ERRORS = {
  SERVER_SIDE_INITIALIZATION: "TernSecure must be initialized on the client side",
  REQUIRES_VERIFICATION: "AUTH_REQUIRES_VERIFICATION",
  AUTHENTICATED: "AUTHENTICATED",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  UNVERIFIED: "UNVERIFIED",
  NOT_INITIALIZED: "TernSecure services are not initialized. Call initializeTernSecure() first",
  HOOK_CONTEXT: "Hook must be used within TernSecureProvider",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_DISABLED: "USER_DISABLED",
  TOO_MANY_ATTEMPTS: "TOO_MANY_ATTEMPTS",
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_EMAIL: "INVALID_EMAIL",
  WEAK_PASSWORD: "WEAK_PASSWORD",
  EMAIL_EXISTS: "EMAIL_EXISTS",
  POPUP_BLOCKED: "POPUP_BLOCKED",
  OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED",
  EXPIRED_TOKEN: "EXPIRED_TOKEN",
  INVALID_TOKEN: "INVALID_TOKEN",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  UNKNOWN_ERROR: "An unknown error occurred.",
  INVALID_ARGUMENT: "Invalid argument provided.",
  USER_NOT_FOUND: "auth/user-not-found",
  WRONG_PASSWORD: "auth/wrong-password",
  EMAIL_ALREADY_IN_USE: "auth/email-already-in-use",
  REQUIRES_RECENT_LOGIN: "auth/requires-recent-login",
  INCORRECT_ARGUMENT: "auth/argument-error",
  NO_SESSION_COOKIE: "No session cookie found.",
  INVALID_SESSION_COOKIE: "Invalid session cookie.",
  NO_ID_TOKEN: "No ID token found.",
  INVALID_ID_TOKEN: "Invalid ID token.",
  REDIRECT_LOOP: "Redirect loop detected.",
} as const

