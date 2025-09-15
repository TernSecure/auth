import { Redis } from "@upstash/redis";

import { authLogger } from "../utils/logger";
import type {
  DisabledUserAdapter,
  DisabledUserRecord,
  RedisConfig,
} from "./types";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class TTLCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTTL: number;

  constructor(defaultTTLMs: number = 60000) {
    this.defaultTTL = defaultTTLMs;
  }

  set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
    console.log(`TTLCache.set: key=${key}, value=${JSON.stringify(value)}, expiresAt=${expiresAt}, cacheSize=${this.cache.size}`);
  }

  private getEntry(key: string): CacheEntry<T> | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now > entry.expiresAt) {
      console.log(`TTLCache: key=${key} expired (now=${now}, expiresAt=${entry.expiresAt})`);
      this.cache.delete(key);
      return undefined;
    }

    return entry;
  }

  get(key: string): T | undefined {
    const entry = this.getEntry(key);
    const hasEntry = entry !== undefined;
    const cacheHasKey = this.cache.has(key);
    const rawEntry = this.cache.get(key);
    
    console.log(`TTLCache.get: key=${key}, hasEntry=${hasEntry}, cacheHasKey=${cacheHasKey}`);
    console.log(`TTLCache.get: rawEntry=${JSON.stringify(rawEntry)}, entry=${JSON.stringify(entry)}`);
    
    if (!entry) {
      console.log(`TTLCache.get: no entry found for key=${key}, returning undefined`);
      return undefined;
    }

    console.log(`TTLCache.get: returning value=${JSON.stringify(entry.value)} for key=${key}`);
    return entry.value;
  }


  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export class RedisAdapter implements DisabledUserAdapter {
  private redis: Redis;
  private cache: TTLCache<DisabledUserRecord | null>;
  private keyPrefix: string;

  constructor(config: RedisConfig) {
    this.redis = new Redis({
      url: config.url,
      token: config.token,
    });

    this.keyPrefix = config.keyPrefix || "disabled_user:";
    const cacheTTL = config.ttl || 30000; // Default 30 seconds
    this.cache = new TTLCache<DisabledUserRecord | null>(cacheTTL);

    setInterval(() => this.cache.cleanup(), 5 * 60 * 1000);
  }

  getDisabledUser = async (uid: string): Promise<DisabledUserRecord | null> => {
    const cacheKey = `${this.keyPrefix}${uid}`;
    
    authLogger.debug(`RedisAdapter: Checking cache for key: ${cacheKey}`);
    
    // Try to get from cache first
    const cachedResult = this.cache.get(cacheKey);
    authLogger.debug(`RedisAdapter: Cache get result for ${cacheKey}:`, {
      cachedResult: JSON.stringify(cachedResult),
      isUndefined: cachedResult === undefined,
      type: typeof cachedResult
    });
    
    if (cachedResult !== undefined) {
      authLogger.debug(`Cache hit for disabled user: ${uid}`, { 
        cacheKey,
        cachedResult: JSON.stringify(cachedResult)
      });
      return cachedResult;
    }

    authLogger.debug(
      `Cache miss for disabled user: ${uid}, fetching from Redis with key: ${cacheKey}`
    );

    try {
      const disabledUser: DisabledUserRecord | null =
        await this.redis.get(cacheKey);

      authLogger.debug(`Redis returned for key ${cacheKey}:`, { 
        disabledUser: JSON.stringify(disabledUser),
        type: typeof disabledUser
      });

      // Cache the result (including null values to prevent repeated Redis calls)
      this.cache.set(cacheKey, disabledUser);
    
      authLogger.debug(`Cached disabled user result for: ${uid}`, {
        cacheKey,
        isDisabled: !!disabledUser,
        cachedValue: JSON.stringify(disabledUser)
      });

      return disabledUser;
    } catch (error) {
      authLogger.error("Failed to fetch disabled user from Redis:", error);
      return null;
    }
  };

  invalidateCache(uid: string): void {
    const cacheKey = `${this.keyPrefix}${uid}`;
    this.cache.delete(cacheKey);
  }
}
