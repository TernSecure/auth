/**
 * TernSecure User
 */
export interface IdTokenResult_DEPRECATED {
  authTime: string;
  expirationTime: string;
  issuedAtTime: string;
  signInProvider: string | null;
  signInSecondFactor: string | null;
  token: string;
  claims: Record<string, any>;
}

/**
 * parsed can be replaced with
 */
//claims: { [key: string]: any } | null

export interface ParsedToken {
  /** Expiration time of the token. */
  exp?: string;
  /** UID of the user. */
  sub?: string;
  /** Time at which authentication was performed. */
  auth_time?: string;
  /** Issuance time of the token. */
  iat?: string;
  /** Firebase specific claims, containing the provider(s) used to authenticate the user. */
  firebase?: {
    sign_in_provider?: string;
    sign_in_second_factor?: string;
    identities?: Record<string, string>;
  };
  /** Map of any additional custom claims. */
  [key: string]: unknown;
}

/**
 * Core properties for any session that is or was authenticated.
 * These properties are guaranteed to exist for active, expired, or revoked sessions.
 */
export interface IdTokenResult {
  /** Time at which authentication was performed (from token claims). */
  authTime: string;
  /** The ID token expiration time (e.g., UTC string or Unix timestamp). */
  expirationTime: string;
  /** The ID token issuance time. */
  issuedAtTime: string;
  /** signInProvider */
  signInProvider: string | null;
  /** signInSecondFactor */
  signInSecondFactor: string | null;
  /** The Firebase Auth ID token JWT string. */
  token: string;
  /**
   * The entire payload claims of the ID token including the standard reserved claims
   * as well as custom claims.
   */
  claims: ParsedToken;
}

const OperationType = {
  SIGN_IN: 'signIn',
  LINK: 'link',
  REAUTHENTICATE: 'reauthenticate',
} as const;

export interface UserInfo {
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  providerId: string;
  uid: string;
}

export interface TernSecureUser extends UserInfo {
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  providerData: UserInfo[];
  refreshToken: string;
  tenantId: string | null;
  delete(): Promise<void>;
  getIdToken(forceRefresh?: boolean): Promise<string>;
  getIdTokenResult(forceRefresh?: boolean): Promise<IdTokenResult>;
  reload(): Promise<void>;
  toJSON(): object;
}

export type TernSecureUserData = {
  uid: string;
  email: string | null;
  emailVerified?: boolean;
  displayName?: string | null;
};

export type UserCredential = {
  user?: any;
  providerId?: string | null;
  operationType?: (typeof OperationType)[keyof typeof OperationType] | null;
}

/**
 * TernSecure Firebase configuration interface
 * Extends Firebase's base configuration options
 */
export interface TernSecureConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  appName?: string;
  tenantId?: string;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  config: TernSecureConfig;
}

/**
 * TernSecure initialization options
 */
export interface TernSecureOptions {
  /** Environment setting for different configurations */
  environment?: 'development' | 'production';
  /** Geographic region for data storage */
  region?: string;
  /** Custom error handler */
  onError?: (error: Error) => void;
  /** Debug mode flag */
  debug?: boolean;
}

/**
 * Firebase initialization state
 */
export interface FirebaseState {
  /** Whether Firebase has been initialized */
  initialized: boolean;
  /** Any initialization errors */
  error: Error | null;
  /** Timestamp of last initialization attempt */
  lastInitAttempt?: number;
}

/**
 * Firebase Admin configuration interface
 */
export interface TernSecureAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

/**
 * Firebase Server configuration interface
 */
export interface TernSecureServerConfig {
  apiKey: string;
}

/**
 * Firebase Admin configuration validation result
 */
export interface AdminConfigValidationResult {
  isValid: boolean;
  errors: string[];
  config: TernSecureAdminConfig;
}

/**
 * Firebase Server configuration validation result
 */
export interface ServerConfigValidationResult {
  isValid: boolean;
  errors: string[];
  config: TernSecureServerConfig;
}

export type InstanceType = 'production' | 'development';
