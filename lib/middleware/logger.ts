import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/errors';

// Request logging middleware
export function logRequest(request: NextRequest) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             request.headers.get('x-client-ip') ||
             'unknown';

  logger.info('HTTP Request', {
    method: request.method,
    url: url.pathname,
    query: Object.fromEntries(url.searchParams),
    userAgent,
    ip,
    referer: request.headers.get('referer'),
    contentType: request.headers.get('content-type'),
  });

  return logger;
}

// Response logging helper
export function logResponse(logger: any, response: NextResponse, startTime: number) {
  const duration = Date.now() - startTime;

  logger.info('HTTP Response', {
    status: response.status,
    duration: `${duration}ms`,
    headers: Object.fromEntries(response.headers),
  });
}

// Performance monitoring helper
export function logPerformance(operation: string, startTime: number, context?: Record<string, any>) {
  const duration = Date.now() - startTime;

  if (duration > 1000) { // Log slow operations (> 1 second)
    logger.warn(`Slow operation: ${operation}`, {
      duration: `${duration}ms`,
      ...context
    });
  } else if (duration > 100) { // Log moderately slow operations (> 100ms)
    logger.info(`Operation completed: ${operation}`, {
      duration: `${duration}ms`,
      ...context
    });
  }
}
