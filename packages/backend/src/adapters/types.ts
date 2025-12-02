export interface DisabledUserRecord {
  uid: string;
  email: string;
  disabledTime: string;
}

export interface AdapterConfig {
  url: string;
  token: string;
}

export interface RedisConfig extends AdapterConfig {
  keyPrefix?: string;
  ttl?: number;
}

export interface PostgresConfig extends AdapterConfig {
  database?: string;
  table?: string;
}

export interface DisabledUserAdapter {
  getDisabledUser(uid: string): Promise<DisabledUserRecord | null>;
}

export type AdapterType = 'redis' | 'postgres';

export interface AdapterConfiguration {
  type: AdapterType;
  config: RedisConfig | PostgresConfig;
}

export interface CheckRevokedOptions {
  enabled: boolean;
  adapter?: AdapterConfiguration;
}


/**
 * AppCheck token cache configuration
 * Supports both in-memory and Redis caching strategies
 */
export interface AppCheckOptions {
  /**
   * Cache strategy: 'memory' for in-memory Map, 'redis' for Redis store
   * Required field to explicitly define caching behavior
   */
  strategy: 'memory' | 'redis';

  /**
   * Token TTL in milliseconds (30 minutes to 7 days)
   * @default 3600000 (1 hour)
   * @min 1800000 (30 minutes)
   * @max 604800000 (7 days)
   */
  ttlMillis?: number;

  /**
   * Buffer time before expiry to trigger token refresh (in milliseconds)
   * @default 300000 (5 minutes)
   */
  refreshBufferMillis?: number;

  /**
   * Custom cache key prefix for Redis
   * Full Redis key will be: keyPrefix + appId
   * @default 'appcheck:token:'
   * @example With default prefix and appId '1:123456:web:abc123', key becomes 'appcheck:token:1:123456:web:abc123'
   */
  keyPrefix?: string;

  /**
   * Redis configuration (required if strategy is 'redis')
   * Includes url and token for deployed Redis instances
   */
  redis?: AdapterConfig;

  /**
   * Skip in-memory cache and directly query Redis (only applies when strategy is 'redis')
   * When false (default), checks in-memory cache first before falling back to Redis
   * When true, always queries Redis directly without checking in-memory cache
   * @default false
   */
  skipInMemoryFirst?: boolean;
}