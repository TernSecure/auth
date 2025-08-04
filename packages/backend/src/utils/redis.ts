import { Redis } from "@upstash/redis"
import { redisLogger } from "./logger"

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export interface DisabledUserRecord {
  uid: string
  email: string
  disabledTime: string
}

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class TTLCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private readonly defaultTTL: number

  constructor(defaultTTLMs: number = 60000) { // Default 1 minute
    this.defaultTTL = defaultTTLMs
  }

  set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTTL)
    this.cache.set(key, { value, expiresAt })
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// Cache for disabled user records - 30 second TTL to balance performance and consistency
const disabledUserCache = new TTLCache<DisabledUserRecord | null>(30000)

// Cleanup expired entries every 5 minutes
setInterval(() => disabledUserCache.cleanup(), 5 * 60 * 1000)

export async function getDisabledUser(uid: string): Promise<DisabledUserRecord | null> {
  const cacheKey = `disabled_user:${uid}`
  
  // Check cache first
  const cachedResult = disabledUserCache.get(cacheKey)
  if (cachedResult !== undefined) {
    redisLogger.debug(`Cache hit for disabled user: ${uid}`)
    return cachedResult
  }

  redisLogger.debug(`Cache miss for disabled user: ${uid}, fetching from Redis`)

  try {
    const disabledUser: DisabledUserRecord | null = await redis.get(cacheKey)
    
    // Cache the result (including null values to prevent repeated Redis calls for non-disabled users)
    disabledUserCache.set(cacheKey, disabledUser)
    
    redisLogger.debug(`Cached disabled user result for: ${uid}`, { isDisabled: !!disabledUser })
    
    return disabledUser
  } catch (error) {
    redisLogger.error('Failed to fetch disabled user from Redis:', error)
    return null
  }
}

export function invalidateDisabledUserCache(uid: string): void {
  const cacheKey = `disabled_user:${uid}`
  disabledUserCache.delete(cacheKey)
}
