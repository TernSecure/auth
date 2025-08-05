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