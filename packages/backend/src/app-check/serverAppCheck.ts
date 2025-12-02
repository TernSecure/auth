import { Redis } from "@upstash/redis";

import type { AppCheckOptions } from '../adapters/types';
import { appCheckAdmin } from '../utils/admin-init';

interface CachedToken {
  token: string;
  expiresAt: number;
}

/**
 * Redis client interface for AppCheck token caching (Upstash Redis or compatible adapter)
 */
interface RedisClient {
  get(key: string): Promise<any>;
  set(key: string, value: any, opts?: { px?: number }): Promise<any>;
  del(key: string): Promise<number>;
}


export class ServerAppCheckManager {
  private static instances: Map<string, ServerAppCheckManager> = new Map();
  private memoryCache: Map<string, CachedToken> = new Map();
  private redisClient: RedisClient | null = null;
  private readonly options: Required<Omit<AppCheckOptions, 'redis' | 'skipInMemoryFirst'>> & {
    redis?: AppCheckOptions['redis'];
    skipInMemoryFirst: boolean;
  };
  private pendingTokens: Map<string, Promise<string | null>> = new Map();

  private constructor(options?: AppCheckOptions) {
    const defaultOptions: Required<Omit<AppCheckOptions, 'redis' | 'skipInMemoryFirst'>> & { skipInMemoryFirst: boolean } = {
      strategy: 'memory',
      ttlMillis: 3600000, // 1 hour
      refreshBufferMillis: 300000, // 5 minutes
      keyPrefix: 'appcheck:token:',
      skipInMemoryFirst: false,
    };

    this.options = { ...defaultOptions, ...options };

    if (this.options.strategy === 'redis' && this.options.redis) {
      void this.initializeRedis(this.options.redis);
    }
  }

  private initializeRedis = (config: AppCheckOptions['redis']): void => {
    if (!config) {
      throw new Error('[AppCheck] Redis configuration is required when strategy is "redis"');
    }

    try {
      this.redisClient = new Redis({
        url: config.url,
        token: config.token,
      });

      console.info('[AppCheck] Redis client initialized for token caching');
    } catch (error) {
      console.error('[AppCheck] Failed to initialize Redis client:', error);
      throw new Error('[AppCheck] Redis initialization failed. Install "@upstash/redis" package.');
    }
  }

  public static getInstance(options?: AppCheckOptions): ServerAppCheckManager {
    const key = options?.strategy || 'memory';

    if (!ServerAppCheckManager.instances.has(key)) {
      ServerAppCheckManager.instances.set(key, new ServerAppCheckManager(options));
    }

    const instance = ServerAppCheckManager.instances.get(key);
    if (!instance) {
      throw new Error('[AppCheck] Failed to get instance');
    }

    return instance;
  }

  private buildCacheKey(appId: string): string {
    return `${this.options.keyPrefix}${appId}`;
  }


  private getCachedToken = async (appId: string): Promise<CachedToken | null> => {
    if (this.options.strategy === 'memory') {
      return this.memoryCache.get(appId) || null;
    }

    if (this.options.strategy === 'redis') {
      // Check in-memory cache first (unless skipInMemoryFirst is true)
      if (!this.options.skipInMemoryFirst) {
        const memCached = this.memoryCache.get(appId);
        if (memCached) {
          return memCached;
        }
      }

      // Fallback to Redis
      if (this.redisClient) {
        try {
          const key = this.buildCacheKey(appId);
          const cached = await this.redisClient.get(key);

          if (cached) {
            const parsed: CachedToken = typeof cached === 'string' ? JSON.parse(cached) : cached;

            if (!this.options.skipInMemoryFirst) {
              this.memoryCache.set(appId, parsed);
            }

            return parsed;
          }
        } catch (error) {
          console.error('[AppCheck] Redis get error:', error);
        }
      }
    }

    return null;
  }


  private setCachedToken = async (appId: string, token: string, expiresAt: number): Promise<void> => {
    const cachedToken: CachedToken = { token, expiresAt };

    // Always store in memory cache for both strategies
    this.memoryCache.set(appId, cachedToken);

    if (this.options.strategy === 'memory') {
      return;
    }

    // For Redis strategy, also persist to Redis
    if (this.options.strategy === 'redis' && this.redisClient) {
      try {
        const key = this.buildCacheKey(appId);
        const ttl = expiresAt - Date.now();

        await this.redisClient.set(key, JSON.stringify(cachedToken), {
          px: ttl, // Expiry in milliseconds (lowercase for Upstash)
        });
      } catch (error) {
        console.error('[AppCheck] Redis set error:', error);
      }
    }
  }

  getOrGenerateToken = async (appId: string): Promise<string | null> => {
    const cached = await this.getCachedToken(appId);
    const now = Date.now();

    if (cached && cached.expiresAt > now + this.options.refreshBufferMillis) {
      return cached.token;
    }

    const pending = this.pendingTokens.get(appId);
    if (pending) {
      return pending;
    }

    const tokenPromise = this.generateAndCacheToken(appId);
    this.pendingTokens.set(appId, tokenPromise);

    try {
      const token = await tokenPromise;
      return token;
    } finally {
      this.pendingTokens.delete(appId);
    }
  }

  /**
   * Generate and cache a new token
   */
  private generateAndCacheToken = async (appId: string): Promise<string | null> => {
    try {
      const now = Date.now();

      const appCheckToken = await appCheckAdmin.createToken(appId, {
        ttlMillis: this.options.ttlMillis,
      });

      const expiresAt = now + this.options.ttlMillis;
      await this.setCachedToken(appId, appCheckToken.token, expiresAt);

      return appCheckToken.token;
    } catch (error) {
      console.error('[AppCheck] Failed to generate token:', error);
      return null;
    }
  }

  clearCache = async (appId?: string): Promise<void> => {
    if (appId) {
      this.memoryCache.delete(appId);
    } else {
      this.memoryCache.clear();
    }

    if (this.options.strategy === 'redis' && this.redisClient) {
      try {
        if (appId) {
          const key = this.buildCacheKey(appId);
          await this.redisClient.del(key);
        }
      } catch (error) {
        console.error('[AppCheck] Redis delete error:', error);
      }
    }
  }

  getCacheStats(): {
    strategy: string;
    memorySize: number;
    entries: Array<{ appId: string; expiresIn: number }>
  } {
    const now = Date.now();
    const entries = Array.from(this.memoryCache.entries()).map(([appId, cached]) => ({
      appId,
      expiresIn: Math.max(0, cached.expiresAt - now),
    }));

    return {
      strategy: this.options.strategy,
      memorySize: this.memoryCache.size,
      entries,
    };
  }

  /**
   * Close Redis connection
   */
  disconnect(): void {
    if (this.redisClient) {
      this.redisClient = null;
    }
  }
}