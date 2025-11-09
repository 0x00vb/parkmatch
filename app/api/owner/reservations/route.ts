import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { logError, logInfo } from "@/lib/errors";

// Validation schemas
const querySchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
});

// GET /api/owner/reservations - Get reservations for owner's garages
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

    // Check if user is owner
    if (session.user.role !== "CONDUCTOR_PROPIETARIO") {
      return NextResponse.json(
        { error: "Access denied. Owner role required." },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { status, limit = 20, offset = 0 } = querySchema.parse(queryParams);

    // Build where clause for reservations on owner's garages
    const where: any = {
      garage: {
        userId: session.user.id, // Reservations on garages owned by this user
      },
    };

    if (status) {
      where.status = status;
    }

    // Fetch reservations for owner's garages
    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          garage: {
            select: {
              id: true,
              address: true,
              city: true,
              latitude: true,
              longitude: true,
              hourlyPrice: true,
            },
          },
          vehicle: {
            select: {
              brand: true,
              model: true,
              licensePlate: true,
              year: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: [
          { status: "asc" }, // Pending first
          { createdAt: "desc" }, // Most recent first
        ],
        take: limit,
        skip: offset,
      }),
      prisma.reservation.count({ where }),
    ]);

    // Group reservations by status for better organization
    const groupedReservations = {
      pending: reservations.filter(r => r.status === 'PENDING'),
      confirmed: reservations.filter(r => r.status === 'CONFIRMED'),
      active: reservations.filter(r => r.status === 'ACTIVE'),
      completed: reservations.filter(r => r.status === 'COMPLETED'),
      cancelled: reservations.filter(r => r.status === 'CANCELLED'),
    };

    logInfo("Owner reservations fetched", { 
      ownerId: session.user.id, 
      total, 
      pending: groupedReservations.pending.length 
    });

    return NextResponse.json({
      success: true,
      reservations,
      groupedReservations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats: {
        total,
        pending: groupedReservations.pending.length,
        confirmed: groupedReservations.confirmed.length,
        active: groupedReservations.active.length,
        completed: groupedReservations.completed.length,
        cancelled: groupedReservations.cancelled.length,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    logError(error as Error, { context: "Error fetching owner reservations" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
