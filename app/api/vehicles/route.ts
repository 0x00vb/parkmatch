import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/auth-middleware";
import { z } from "zod";

const createVehicleSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().optional(),
  licensePlate: z.string().min(1),
  height: z.number().optional(),
  width: z.number().optional(),
  length: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Verificar que el usuario tenga rol de conductor (ambos roles pueden gestionar vehículos)
    const session = await requireDriver(request);

    const vehicles = await prisma.vehicle.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ vehicles }, { status: 200 });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario tenga rol de conductor (ambos roles pueden gestionar vehículos)
    const session = await requireDriver(request);

    const body = await request.json();
    const vehicleData = createVehicleSchema.parse(body);

    const vehicle = await prisma.vehicle.create({
      data: {
        ...vehicleData,
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      { message: "Vehículo creado exitosamente", vehicle },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
