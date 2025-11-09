import { cache } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

// Cache keys
const CACHE_KEYS = {
  USER_RESERVATIONS: (userId: string) => `user:${userId}:reservations`,
  GARAGE_AVAILABILITY: (garageId: string, date: string) => `garage:${garageId}:availability:${date}`,
  RESERVATION_DETAILS: (reservationId: string) => `reservation:${reservationId}`,
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  USER_RESERVATIONS: 300, // 5 minutes
  GARAGE_AVAILABILITY: 600, // 10 minutes
  RESERVATION_DETAILS: 180, // 3 minutes
};

/**
 * Vehicle compatibility validation
 */
export interface VehicleCompatibilityResult {
  compatible: boolean;
  issues: string[];
  score: number; // 0-100, higher is better fit
}

export function validateVehicleCompatibility(
  vehicle: {
    height?: number;
    width?: number;
    length?: number;
    minHeight?: number;
    coveredOnly: boolean;
  },
  garage: {
    height: number;
    width: number;
    length: number;
    type: "COVERED" | "UNCOVERED";
  }
): VehicleCompatibilityResult {
  const issues: string[] = [];
  let score = 100;

  // Height compatibility
  if (vehicle.height && garage.height) {
    if (vehicle.height > garage.height) {
      issues.push(`Altura del vehículo (${vehicle.height}m) excede la del garage (${garage.height}m)`);
      score = 0;
    } else {
      // Reduce score if clearance is tight (less than 20cm)
      const clearance = garage.height - vehicle.height;
      if (clearance < 0.2) {
        score -= 20;
      }
    }
  }

  // Width compatibility
  if (vehicle.width && garage.width) {
    if (vehicle.width > garage.width) {
      issues.push(`Ancho del vehículo (${vehicle.width}m) excede el del garage (${garage.width}m)`);
      score = 0;
    } else {
      const clearance = garage.width - vehicle.width;
      if (clearance < 0.1) {
        score -= 15;
      }
    }
  }

  // Length compatibility
  if (vehicle.length && garage.length) {
    if (vehicle.length > garage.length) {
      issues.push(`Largo del vehículo (${vehicle.length}m) excede el del garage (${garage.length}m)`);
      score = 0;
    } else {
      const clearance = garage.length - vehicle.length;
      if (clearance < 0.2) {
        score -= 10;
      }
    }
  }

  // Covered requirement
  if (vehicle.coveredOnly && garage.type !== "COVERED") {
    issues.push("El vehículo requiere cochera cubierta");
    score = 0;
  }

  // Minimum height requirement
  if (vehicle.minHeight && garage.height < vehicle.minHeight) {
    issues.push(`Altura mínima requerida: ${vehicle.minHeight}m, garage: ${garage.height}m`);
    score = 0;
  }

  return {
    compatible: issues.length === 0,
    issues,
    score: Math.max(0, score),
  };
}

/**
 * Check time slot availability for a garage
 */
export async function checkGarageAvailability(
  garageId: string,
  startTime: Date,
  endTime: Date,
  excludeReservationId?: string
): Promise<boolean> {
  const cacheKey = CACHE_KEYS.GARAGE_AVAILABILITY(garageId, startTime.toDateString());
  
  try {
    // Try to get from cache first
    const cached = await cache.get<string>(cacheKey);
    if (cached) {
      // Parse cached data and check availability
      const reservations = JSON.parse(cached);
      return !hasTimeConflict(reservations, startTime, endTime, excludeReservationId);
    }

    // Fetch from database
    const reservations = await prisma.reservation.findMany({
      where: {
        garageId,
        status: {
          in: ["PENDING", "CONFIRMED", "ACTIVE"],
        },
        startTime: {
          gte: new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate()),
          lt: new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate() + 1),
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    });

    // Cache the result
    await cache.set(cacheKey, JSON.stringify(reservations), CACHE_TTL.GARAGE_AVAILABILITY);

    return !hasTimeConflict(reservations, startTime, endTime, excludeReservationId);
  } catch (error) {
    console.error("Error checking garage availability:", error);
    // Fallback to direct database check
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        garageId,
        status: {
          in: ["PENDING", "CONFIRMED", "ACTIVE"],
        },
        ...(excludeReservationId && { id: { not: excludeReservationId } }),
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    return !conflictingReservation;
  }
}

/**
 * Helper function to check time conflicts
 */
function hasTimeConflict(
  reservations: Array<{ id: string; startTime: string | Date; endTime: string | Date }>,
  startTime: Date,
  endTime: Date,
  excludeReservationId?: string
): boolean {
  return reservations.some((reservation) => {
    if (excludeReservationId && reservation.id === excludeReservationId) {
      return false;
    }

    const resStart = new Date(reservation.startTime);
    const resEnd = new Date(reservation.endTime);

    return (
      (startTime >= resStart && startTime < resEnd) ||
      (endTime > resStart && endTime <= resEnd) ||
      (startTime <= resStart && endTime >= resEnd)
    );
  });
}

/**
 * Calculate reservation price based on duration and available pricing tiers
 */
export function calculateReservationPrice(
  garage: {
    hourlyPrice?: number | null;
    dailyPrice?: number | null;
    monthlyPrice?: number | null;
  },
  startTime: Date,
  endTime: Date,
  options: {
    peakHourMultiplier?: number;
    weekendMultiplier?: number;
    minimumHours?: number;
  } = {}
): { price: number; pricingType: 'hourly' | 'daily' | 'monthly'; breakdown: string } {
  const {
    peakHourMultiplier = 1.2,
    weekendMultiplier = 1.1,
    minimumHours = 1,
  } = options;

  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = Math.max(durationMs / (1000 * 60 * 60), minimumHours);
  const durationDays = durationHours / 24;
  const durationWeeks = durationDays / 7;
  const durationMonths = durationDays / 30; // Approximate month as 30 days

  let price: number;
  let pricingType: 'hourly' | 'daily' | 'monthly';
  let breakdown: string;

  // Determine pricing strategy based on duration and available prices
  if (durationHours < 24 && garage.hourlyPrice) {
    // Use hourly pricing for reservations less than 24 hours
    price = garage.hourlyPrice * durationHours;
    pricingType = 'hourly';
    breakdown = `${durationHours.toFixed(1)} horas × $${garage.hourlyPrice}/hora`;
  } else if (durationDays < 7 && garage.dailyPrice) {
    // Use daily pricing for reservations 1-7 days
    const days = Math.ceil(durationDays);
    price = garage.dailyPrice * days;
    pricingType = 'daily';
    breakdown = `${days} día${days > 1 ? 's' : ''} × $${garage.dailyPrice}/día`;
  } else if (durationDays >= 7 && garage.monthlyPrice) {
    // Use monthly pricing for reservations 7+ days
    const months = Math.ceil(durationMonths);
    price = garage.monthlyPrice * months;
    pricingType = 'monthly';
    breakdown = `${months} mes${months > 1 ? 'es' : ''} × $${garage.monthlyPrice}/mes`;
  } else if (garage.dailyPrice) {
    // Fallback to daily pricing if monthly not available
    const days = Math.ceil(durationDays);
    price = garage.dailyPrice * days;
    pricingType = 'daily';
    breakdown = `${days} día${days > 1 ? 's' : ''} × $${garage.dailyPrice}/día`;
  } else if (garage.hourlyPrice) {
    // Final fallback to hourly pricing
    price = garage.hourlyPrice * durationHours;
    pricingType = 'hourly';
    breakdown = `${durationHours.toFixed(1)} horas × $${garage.hourlyPrice}/hora`;
  } else {
    throw new Error('No pricing available for this garage');
  }

  // Apply peak hour pricing (7-9 AM, 5-7 PM on weekdays)
  const hour = startTime.getHours();
  const isWeekday = startTime.getDay() >= 1 && startTime.getDay() <= 5;
  const isPeakHour = isWeekday && ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19));

  if (isPeakHour) {
    price *= peakHourMultiplier;
    breakdown += ` (hora pico: ×${peakHourMultiplier})`;
  }

  // Apply weekend pricing
  const isWeekend = startTime.getDay() === 0 || startTime.getDay() === 6;
  if (isWeekend) {
    price *= weekendMultiplier;
    breakdown += ` (fin de semana: ×${weekendMultiplier})`;
  }

  return {
    price: Math.round(price * 100) / 100, // Round to 2 decimal places
    pricingType,
    breakdown
  };
}

/**
 * Get user reservations with caching
 */
export async function getUserReservations(
  userId: string,
  options: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const cacheKey = CACHE_KEYS.USER_RESERVATIONS(userId);
  
  try {
    // Try cache first for recent reservations
    if (!options.status && !options.offset) {
      const cached = await cache.get<string>(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        return {
          reservations: data.reservations.slice(0, options.limit || 20),
          total: data.total,
        };
      }
    }

    // Build where clause
    const where: any = { userId };
    if (options.status) {
      where.status = options.status;
    }

    // Fetch from database
    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          garage: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
          vehicle: true,
        },
        orderBy: { createdAt: "desc" },
        take: options.limit || 20,
        skip: options.offset || 0,
      }),
      prisma.reservation.count({ where }),
    ]);

    // Cache recent reservations
    if (!options.status && !options.offset) {
      await cache.set(
        cacheKey,
        JSON.stringify({ reservations, total }),
        CACHE_TTL.USER_RESERVATIONS
      );
    }

    return { reservations, total };
  } catch (error) {
    console.error("Error fetching user reservations:", error);
    throw error;
  }
}

/**
 * Invalidate cache for reservation-related data
 */
export async function invalidateReservationCache(
  userId: string,
  garageId?: string,
  reservationId?: string
) {
  const keysToInvalidate = [
    CACHE_KEYS.USER_RESERVATIONS(userId),
  ];

  if (garageId) {
    // Invalidate garage availability cache for today and tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    keysToInvalidate.push(
      CACHE_KEYS.GARAGE_AVAILABILITY(garageId, today.toDateString()),
      CACHE_KEYS.GARAGE_AVAILABILITY(garageId, tomorrow.toDateString())
    );
  }

  if (reservationId) {
    keysToInvalidate.push(CACHE_KEYS.RESERVATION_DETAILS(reservationId));
  }

  // Invalidate all keys
  await Promise.all(
    keysToInvalidate.map(key => cache.del(key).catch(() => {}))
  );
}

/**
 * Validate reservation time constraints
 */
export function validateReservationTime(startTime: Date, endTime: Date): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const now = new Date();

  // Check if start time is in the future
  if (startTime <= now) {
    errors.push("La hora de inicio debe ser en el futuro");
  }

  // Check if end time is after start time
  if (endTime <= startTime) {
    errors.push("La hora de fin debe ser posterior a la hora de inicio");
  }

  // Check minimum duration (30 minutes)
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = durationMs / (1000 * 60);
  if (durationMinutes < 30) {
    errors.push("La duración mínima de reserva es 30 minutos");
  }

  // Check maximum duration (24 hours)
  const durationHours = durationMs / (1000 * 60 * 60);
  if (durationHours > 24) {
    errors.push("La duración máxima de reserva es 24 horas");
  }

  // Check if reservation is not too far in the future (30 days)
  const maxFutureMs = 30 * 24 * 60 * 60 * 1000; // 30 days
  if (startTime.getTime() - now.getTime() > maxFutureMs) {
    errors.push("No se pueden hacer reservas con más de 30 días de anticipación");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
