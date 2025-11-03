import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePreferencesSchema = z.object({
  minHeight: z.number().min(1.5).max(3.0),
  coveredOnly: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { minHeight, coveredOnly } = updatePreferencesSchema.parse(body);

    // For now, we'll store preferences in the user's vehicles
    // In a real app, you might want a separate UserPreferences table
    await prisma.vehicle.updateMany({
      where: { userId: session.user.id },
      data: { 
        minHeight,
        coveredOnly,
      },
    });

    return NextResponse.json(
      { message: "Preferencias actualizadas exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Preferences update error:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
