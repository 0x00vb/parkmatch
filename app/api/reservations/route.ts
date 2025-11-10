import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { logError, logInfo } from "@/lib/errors";
import {
  validateVehicleCompatibility,
  checkGarageAvailability,
  calculateReservationPrice,
  validateReservationTime,
  invalidateReservationCache,
  createReservationWithConcurrencyControl
} from "@/lib/reservations";

// Validation schemas
const createReservationSchema = z.object({
  garageId: z.string().cuid(),
  vehicleId: z.string().cuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: "End time must be after start time",
});

const querySchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
});

// POST /api/reservations - Create new reservation
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = await rateLimit(clientIP, 'api');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createReservationSchema.parse(body);

    // Verify garage exists and is active
    const garage = await prisma.garage.findFirst({
      where: {
        id: validatedData.garageId,
        isActive: true,
      },
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
    });

    if (!garage) {
      return NextResponse.json(
        { error: "Garage not found or not available" },
        { status: 404 }
      );
    }

    // Verify vehicle belongs to user
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: validatedData.vehicleId,
        userId: session.user.id,
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found or not owned by user" },
        { status: 404 }
      );
    }

    // Validate reservation time constraints
    const startTime = new Date(validatedData.startTime);
    const endTime = new Date(validatedData.endTime);
    
    const timeValidation = validateReservationTime(startTime, endTime);
    if (!timeValidation.valid) {
      return NextResponse.json(
        { error: "Invalid reservation time", details: timeValidation.errors },
        { status: 400 }
      );
    }

    // Check vehicle compatibility with garage dimensions
    const compatibility = validateVehicleCompatibility({
      height: vehicle.height ?? undefined,
      width: vehicle.width ?? undefined,
      length: vehicle.length ?? undefined,
      minHeight: vehicle.minHeight ?? undefined,
      coveredOnly: vehicle.coveredOnly,
    }, garage);
    if (!compatibility.compatible) {
      return NextResponse.json(
        { error: "Vehicle not compatible with garage", details: compatibility.issues },
        { status: 400 }
      );
    }

    // Check garage availability
    const isAvailable = await checkGarageAvailability(
      validatedData.garageId,
      startTime,
      endTime
    );

    if (!isAvailable) {
      return NextResponse.json(
        { error: "Este horario no esta disponible" },
        { status: 409 }
      );
    }

    // Calculate total price with dynamic pricing
    const priceCalculation = calculateReservationPrice(
      {
        hourlyPrice: garage.hourlyPrice,
        dailyPrice: garage.dailyPrice,
        monthlyPrice: garage.monthlyPrice,
      },
      startTime,
      endTime
    );
    const totalPrice = priceCalculation.price;

    // Create reservation with concurrency control
    const reservation = await createReservationWithConcurrencyControl({
      userId: session.user.id,
      garageId: validatedData.garageId,
      vehicleId: validatedData.vehicleId,
      startTime,
      endTime,
      totalPrice,
    });

    // Invalidate relevant caches
    await invalidateReservationCache(session.user.id, validatedData.garageId, reservation.id);

    logInfo("Reservation created", { reservationId: reservation.id, userId: session.user.id });
    console.log("Created reservation with ID:", reservation.id, "for user:", session.user.id);

    return NextResponse.json({
      success: true,
      reservation,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    // Handle specific transaction errors
    if (error instanceof Error) {
      if (error.message === "Time slot no longer available" ||
          error.message.includes("La cochera ya está reservada")) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    logError(error as Error, { context: "Error creating reservation" });
    console.error("Reservation creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/reservations - Get user's reservations
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = await rateLimit(clientIP, 'api');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { status, limit = 20, offset = 0 } = querySchema.parse(queryParams);

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    // Fetch reservations
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
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.reservation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      reservations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    logError(error as Error, { context: "Error fetching reservations" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

