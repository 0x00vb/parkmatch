import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth-middleware";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const createGarageSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  type: z.enum(["COVERED", "UNCOVERED"]),
  height: z.number().min(1.5).max(5),
  width: z.number().min(1.5).max(5),
  length: z.number().min(3).max(10),
  hasGate: z.boolean(),
  hasCameras: z.boolean(),
  accessType: z.enum(["REMOTE_CONTROL", "KEYS"]),
  rules: z.string().optional(),
  images: z.array(z.string()).min(1).max(3),
  hourlyPrice: z.number().min(0).optional(),
  dailyPrice: z.number().min(0).optional(),
  monthlyPrice: z.number().min(0).optional(),
  schedules: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
    endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
    isActive: z.boolean(),
  })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario tenga rol de propietario
    const session = await requireOwner(request);

    const body = await request.json();
    const { schedules, ...garageData } = createGarageSchema.parse(body);

    // Create garage with availability schedules in a transaction
    const garage = await prisma.$transaction(async (tx) => {
      // Create the garage
      const createdGarage = await tx.garage.create({
        data: {
          ...garageData,
          userId: session.user.id,
        },
      });

      return createdGarage;
    });

    // Create availability schedules outside the transaction if provided
    if (schedules && schedules.length > 0) {
      await prisma.availabilitySchedule.createMany({
        data: schedules.map(schedule => ({
          garageId: garage.id,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isActive: schedule.isActive,
        })),
      });
    }

    return NextResponse.json(
      { message: "Cochera creada exitosamente", garage },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating garage:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicGarages = searchParams.get('public') === 'true';

    if (publicGarages) {
      // Rate limiting para requests públicos
      const clientIP = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
      await rateLimit(clientIP, 'public');

      // Obtener garages activos para mostrar en el mapa público
      const garages = await prisma.garage.findMany({
        where: { isActive: true },
        select: {
          id: true,
          address: true,
          city: true,
          latitude: true,
          longitude: true,
          type: true,
          height: true,
          width: true,
          length: true,
          hasGate: true,
          hasCameras: true,
          accessType: true,
          rules: true,
          images: true,
          hourlyPrice: true,
          dailyPrice: true,
          monthlyPrice: true,
          isActive: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              firstName: true,
              lastName: true,
            }
          },
          availabilitySchedules: {
            where: { isActive: true },
            orderBy: { dayOfWeek: 'asc' },
          }
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ garages }, { status: 200 });
    } else {
      // Verificar que el usuario tenga rol de propietario para acceder a sus garages
      const session = await requireOwner(request);

      const garages = await prisma.garage.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ garages }, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching garages:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
