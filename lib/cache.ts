import { Redis } from "@upstash/redis";

// Initialize Redis (same as rate limiting)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  MAKES: 3600, // 1 hour - makes don't change often
  MODELS: 3600, // 1 hour - models don't change often
  USER_PROFILE: 300, // 5 minutes - user data
  PARKING_SPOTS: 60, // 1 minute - parking spots change frequently
} as const;

// Cache keys
export const CACHE_KEYS = {
  MAKES: 'makes:all',
  MODELS_BY_MAKE: (makeId: number) => `models:make:${makeId}`,
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  PARKING_SPOTS: (filters: string) => `parking:spots:${filters}`,
} as const;

// Generic cache functions
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data as T;
  } catch (error) {
    console.warn('Cache get error:', error);
    return null;
  }
}

export async function setCached<T>(key: string, data: T, ttl: number): Promise<void> {
  try {
    await redis.set(key, data, { ex: ttl });
  } catch (error) {
    console.warn('Cache set error:', error);
  }
}

export async function deleteCached(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.warn('Cache delete error:', error);
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    // Note: This is a simplified version. In production, you might want to use Redis SCAN
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.warn('Cache invalidate pattern error:', error);
  }
}

// Fallback in-memory cache for when Redis is not available
const memoryCache = new Map<string, { data: any; expires: number }>();

export function getMemoryCache<T>(key: string): T | null {
  const cached = memoryCache.get(key);
  if (!cached) return null;

  if (Date.now() > cached.expires) {
    memoryCache.delete(key);
    return null;
  }

  return cached.data;
}

export function setMemoryCache<T>(key: string, data: T, ttlSeconds: number): void {
  const expires = Date.now() + (ttlSeconds * 1000);
  memoryCache.set(key, { data, expires });
}

// Hybrid cache function (tries Redis first, falls back to memory)
export async function hybridCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Try Redis first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Try memory cache
  const memoryCached = getMemoryCache<T>(key);
  if (memoryCached !== null) {
    return memoryCached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Cache in both places
  try {
    await setCached(key, data, ttl);
  } catch {
    // Redis failed, use memory cache
    setMemoryCache(key, data, ttl);
  }

  return data;
}

// Cache invalidation helpers
export const cacheInvalidation = {
  // Invalidate all makes cache
  makes: () => deleteCached(CACHE_KEYS.MAKES),

  // Invalidate models for a specific make
  modelsByMake: (makeId: number) => deleteCached(CACHE_KEYS.MODELS_BY_MAKE(makeId)),

  // Invalidate all models
  allModels: () => invalidatePattern('models:*'),

  // Invalidate user profile
  userProfile: (userId: string) => deleteCached(CACHE_KEYS.USER_PROFILE(userId)),

  // Invalidate parking spots
  parkingSpots: (filters?: string) => {
    if (filters) {
      deleteCached(CACHE_KEYS.PARKING_SPOTS(filters));
    } else {
      invalidatePattern('parking:spots:*');
    }
  },
};
