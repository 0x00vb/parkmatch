import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/auth-middleware";
import { z } from "zod";

const updateVehicleSchema = z.object({
  brand: z.string().min(1, "La marca es requerida"),
  model: z.string().min(1, "El modelo es requerido"),
  year: z.number().optional(),
  licensePlate: z.string().min(6, "La patente debe tener al menos 6 caracteres"),
  height: z.number().optional(),
  width: z.number().optional(),
  length: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDriver(request);
    const resolvedParams = await params;

    // Get the vehicle belonging to the user
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id,
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehículo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { vehicle },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDriver(request);
    const resolvedParams = await params;
    const body = await request.json();

    // Validate the request body
    const validatedData = updateVehicleSchema.parse(body);

    // Verify the vehicle belongs to the user
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id,
      },
    });

    if (!existingVehicle) {
      return NextResponse.json(
        { message: "Vehículo no encontrado" },
        { status: 404 }
      );
    }

    // Update the vehicle
    const updatedVehicle = await prisma.vehicle.update({
      where: { id: resolvedParams.id },
      data: validatedData,
    });

    return NextResponse.json(
      { message: "Vehículo actualizado exitosamente", vehicle: updatedVehicle },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating vehicle:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDriver(request);
    const resolvedParams = await params;

    // Verify the vehicle belongs to the user
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id,
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehículo no encontrado" },
        { status: 404 }
      );
    }

    await prisma.vehicle.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json(
      { message: "Vehículo eliminado exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
