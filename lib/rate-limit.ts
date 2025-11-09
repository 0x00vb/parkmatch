import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis (you'll need to set these environment variables)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Rate limiters for different endpoints
export const rateLimiters = {
  // Public endpoints - more permissive
  public: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
    analytics: true,
  }),

  // API endpoints - stricter
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests per minute
    analytics: true,
  }),

  // Auth endpoints - very strict
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
    analytics: true,
  }),

  // File uploads - moderate
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 uploads per minute
    analytics: true,
  }),
};

// Rate limiting middleware
export async function rateLimit(
  identifier: string,
  limiter: keyof typeof rateLimiters = 'api'
) {
  try {
    const rateLimiter = rateLimiters[limiter];
    const result = await rateLimiter.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      pending: result.pending,
    };
  } catch (error) {
    // If Redis is not available, allow the request (fail open)
    console.warn("Rate limiting unavailable:", error);
    return {
      success: true,
      limit: 999,
      remaining: 999,
      reset: Date.now() + 60000,
      pending: Promise.resolve(),
    };
  }
}

// Helper to get client IP
export function getClientIP(request: Request): string {
  // Try different headers for IP detection
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const clientIP = request.headers.get("x-client-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (clientIP) {
    return clientIP;
  }

  // Fallback to a generic identifier
  return "unknown";
}
