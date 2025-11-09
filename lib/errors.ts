import { NextResponse } from "next/server";

// Error types
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Common API errors
export const API_ERRORS = {
  UNAUTHORIZED: new ApiError(401, 'No autorizado', 'UNAUTHORIZED'),
  FORBIDDEN: new ApiError(403, 'Acceso denegado', 'FORBIDDEN'),
  NOT_FOUND: new ApiError(404, 'Recurso no encontrado', 'NOT_FOUND'),
  VALIDATION_ERROR: (message: string) => new ApiError(400, message, 'VALIDATION_ERROR'),
  INTERNAL_ERROR: new ApiError(500, 'Error interno del servidor', 'INTERNAL_ERROR'),
  CONFIG_ERROR: (service: string) => new ApiError(500, `Configuración de ${service} no disponible`, 'CONFIG_ERROR'),
} as const;

// Error response helper
export function createErrorResponse(error: ApiError | Error, details?: Record<string, any>) {
  const apiError = error instanceof ApiError ? error : API_ERRORS.INTERNAL_ERROR;

  // Log error with context
  logError(apiError, details);

  return NextResponse.json(
    {
      message: apiError.message,
      code: apiError.code,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    },
    { status: apiError.statusCode }
  );
}

// Success response helper
export function createSuccessResponse(data: any, message?: string, status = 200) {
  const response: any = { success: true };

  if (message) response.message = message;
  if (data !== undefined) response.data = data;

  return NextResponse.json(response, { status });
}

// Structured logging system
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

class Logger {
  private requestId: string;

  constructor(requestId?: string) {
    this.requestId = requestId || this.generateRequestId();
  }

  private generateRequestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private formatLog(level: LogEntry['level'], message: string, context?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      requestId: this.requestId,
    };
  }

  private outputLog(logData: LogEntry) {
    const output = JSON.stringify(logData, null, process.env.NODE_ENV === 'development' ? 2 : 0);

    if (process.env.NODE_ENV === 'development') {
      const colors = {
        debug: '\x1b[37m', // white
        info: '\x1b[36m',  // cyan
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m'  // red
      };
      console.log(`${colors[logData.level]}[${logData.level.toUpperCase()}]\x1b[0m`, output);
    } else {
      // In production, you could send to a logging service like DataDog, LogRocket, etc.
      console.log(output);
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.outputLog(this.formatLog('debug', message, context));
  }

  info(message: string, context?: Record<string, any>) {
    this.outputLog(this.formatLog('info', message, context));
  }

  warn(message: string, context?: Record<string, any>) {
    this.outputLog(this.formatLog('warn', message, context));
  }

  error(message: string, error?: Error | ApiError, context?: Record<string, any>) {
    const errorContext = {
      ...context,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        code: error instanceof ApiError ? error.code : undefined,
      }
    };

    this.outputLog(this.formatLog('error', message, errorContext));
  }
}

// Global logger instance
export const logger = new Logger();

// Convenience functions
export function logError(error: Error | ApiError, context?: Record<string, any>) {
  logger.error(error.message, error, context);
}

export function logInfo(message: string, context?: Record<string, any>) {
  logger.info(message, context);
}

export function logWarn(message: string, context?: Record<string, any>) {
  logger.warn(message, context);
}

export function logDebug(message: string, context?: Record<string, any>) {
  logger.debug(message, context);
}

// Async error wrapper
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<NextResponse | R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof ApiError) {
        return createErrorResponse(error);
      }

      // Log unexpected errors
      logError(error instanceof Error ? error : new Error(String(error)), {
        args: args.length,
        function: fn.name
      });

      return createErrorResponse(API_ERRORS.INTERNAL_ERROR);
    }
  };
}
