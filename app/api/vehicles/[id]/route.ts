import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    // Verify the vehicle belongs to the user
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: params.id,
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
      where: { id: params.id },
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
