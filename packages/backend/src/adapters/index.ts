import { PostgresAdapter } from "./PostgresAdapter";
import { RedisAdapter } from "./RedisAdapter";
import type { AdapterConfiguration,DisabledUserAdapter } from "./types";

export function createAdapter(
  config: AdapterConfiguration
): DisabledUserAdapter {
  switch (config.type) {
    case "redis":
      return new RedisAdapter(config.config as any);
    case "postgres":
      return new PostgresAdapter(config.config as any);
    default:
      throw new Error(`Unsupported adapter type: ${(config as any).type}`);
  }
}

export function validateCheckRevokedOptions(options?: {
  enabled: boolean;
  adapter?: AdapterConfiguration;
}): { isValid: boolean; error?: string } {
  if (options?.enabled && !options.adapter) {
    return {
      isValid: false,
      error: "When checkRevoked.enabled is true, an adapter must be provided",
    };
  }
  return { isValid: true };
}


export { RedisAdapter } from './RedisAdapter';
export { PostgresAdapter } from './PostgresAdapter';
export type {
  DisabledUserAdapter,
  DisabledUserRecord,
  AdapterConfig,
  RedisConfig,
  PostgresConfig,
  AdapterType,
  AdapterConfiguration,
  CheckRevokedOptions,
} from './types';
