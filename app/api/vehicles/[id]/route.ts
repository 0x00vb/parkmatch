import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/auth-middleware";

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
