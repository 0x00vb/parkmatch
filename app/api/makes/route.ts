import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling, logInfo } from "@/lib/errors";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { hybridCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";

async function getMakes(request: NextRequest) {
  // Apply rate limiting
  const clientIP = getClientIP(request);
  const rateLimitResult = await rateLimit(clientIP, 'public');

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: "Demasiadas solicitudes",
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        }
      }
    );
  }

  logInfo("Fetching vehicle makes", { clientIP, cached: true });

  const makes = await hybridCache(
    CACHE_KEYS.MAKES,
    CACHE_TTL.MAKES,
    async () => {
      logInfo("Cache miss - fetching makes from database");
      return await prisma.$queryRaw`
        SELECT id, name
        FROM makes
        ORDER BY name ASC
      `;
    }
  );

  return NextResponse.json({ makes }, { status: 200 });
}

export const GET = withErrorHandling(getMakes);
