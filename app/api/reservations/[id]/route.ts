import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { logError, logInfo } from "@/lib/errors";

// Validation schemas
const updateReservationSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "ACTIVE", "COMPLETED"]),
});

const paramsSchema = z.object({
  id: z.string().cuid(),
});

// GET /api/reservations/[id] - Get specific reservation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Validate params
    const resolvedParams = await params;
    console.log("Raw params:", resolvedParams);
    const { id } = paramsSchema.parse(resolvedParams);
    console.log("Looking for reservation ID:", id, "for user:", session.user.id);
    
    // Additional validation to ensure ID is valid
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // Fetch reservation
    const reservation = await prisma.reservation.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id }, // User's own reservation
          { garage: { userId: session.user.id } }, // User's garage reservation
        ],
      },
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

    console.log("Found reservation:", reservation ? "YES" : "NO");
    
    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      reservation,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.issues },
        { status: 400 }
      );
    }

    logError(error as Error, { context: "Error fetching reservation" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/reservations/[id] - Update reservation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Validate params and body
    const resolvedParams = await params;
    const { id } = paramsSchema.parse(resolvedParams);
    const body = await request.json();
    const { status } = updateReservationSchema.parse(body);

    // Fetch current reservation
    const currentReservation = await prisma.reservation.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id }, // User's own reservation
          { garage: { userId: session.user.id } }, // User's garage reservation
        ],
      },
      include: {
        garage: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        },
      },
    });

    if (!currentReservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Validate status transition
    const isValidTransition = validateStatusTransition(
      currentReservation.status,
      status,
      session.user.id,
      currentReservation.userId,
      currentReservation.garage.userId
    );

    if (!isValidTransition.valid) {
      return NextResponse.json(
        { error: isValidTransition.reason },
        { status: 400 }
      );
    }

    // Update reservation
    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: { status },
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

    logInfo("Reservation status updated", {
      reservationId: id,
      oldStatus: currentReservation.status,
      newStatus: status,
      updatedBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      reservation: updatedReservation,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    logError(error as Error, { context: "Error updating reservation" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/reservations/[id] - Cancel reservation (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Validate params
    const resolvedParams = await params;
    const { id } = paramsSchema.parse(resolvedParams);

    // Fetch current reservation
    const currentReservation = await prisma.reservation.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id }, // User can cancel their own reservation
          { garage: { userId: session.user.id } }, // Garage owner can reject pending reservations
        ],
      },
      include: {
        garage: {
          select: { userId: true },
        },
      },
    });

    if (!currentReservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Check if cancellation is allowed
    if (!["PENDING", "CONFIRMED"].includes(currentReservation.status)) {
      return NextResponse.json(
        { error: "Cannot cancel reservation in current status" },
        { status: 400 }
      );
    }

    // Additional validation: garage owner can only cancel PENDING reservations (reject requests)
    const isGarageOwner = currentReservation.garage.userId === session.user.id;
    if (isGarageOwner && currentReservation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Garage owners can only reject pending reservation requests" },
        { status: 400 }
      );
    }

    // Cancel reservation
    const cancelledReservation = await prisma.reservation.update({
      where: { id },
      data: { status: "CANCELLED" },
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
    });

    logInfo("Reservation cancelled", {
      reservationId: id,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      reservation: cancelledReservation,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.issues },
        { status: 400 }
      );
    }

    logError(error as Error, { context: "Error cancelling reservation" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to validate status transitions
function validateStatusTransition(
  currentStatus: string,
  newStatus: string,
  currentUserId: string,
  reservationUserId: string,
  garageOwnerId: string
): { valid: boolean; reason?: string } {
  const isReservationOwner = currentUserId === reservationUserId;
  const isGarageOwner = currentUserId === garageOwnerId;

  // Define allowed transitions
  const transitions: Record<string, { allowedNext: string[]; requiredRole: "owner" | "renter" | "both" }> = {
    PENDING: {
      allowedNext: ["CONFIRMED", "CANCELLED"],
      requiredRole: "both", // Owner can confirm, renter can cancel
    },
    CONFIRMED: {
      allowedNext: ["ACTIVE", "CANCELLED"],
      requiredRole: "both", // Both can activate or cancel
    },
    ACTIVE: {
      allowedNext: ["COMPLETED"],
      requiredRole: "both", // Both can mark as completed
    },
    COMPLETED: {
      allowedNext: [],
      requiredRole: "both",
    },
    CANCELLED: {
      allowedNext: [],
      requiredRole: "both",
    },
  };

  const transition = transitions[currentStatus];
  if (!transition) {
    return { valid: false, reason: "Invalid current status" };
  }

  if (!transition.allowedNext.includes(newStatus)) {
    return { valid: false, reason: `Cannot transition from ${currentStatus} to ${newStatus}` };
  }

  // Check role permissions
  if (transition.requiredRole === "owner" && !isGarageOwner) {
    return { valid: false, reason: "Only garage owner can perform this action" };
  }

  if (transition.requiredRole === "renter" && !isReservationOwner) {
    return { valid: false, reason: "Only reservation owner can perform this action" };
  }

  // Special cases for specific transitions
  if (currentStatus === "PENDING" && newStatus === "CONFIRMED" && !isGarageOwner) {
    return { valid: false, reason: "Only garage owner can confirm reservations" };
  }

  if (currentStatus === "PENDING" && newStatus === "CANCELLED" && !isReservationOwner && !isGarageOwner) {
    return { valid: false, reason: "Only reservation owner or garage owner can cancel pending reservations" };
  }

  return { valid: true };
}
