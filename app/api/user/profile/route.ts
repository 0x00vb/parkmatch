import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProfileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(10),
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
    const { firstName, lastName, phone } = updateProfileSchema.parse(body);

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        firstName,
        lastName,
        phone,
        name: `${firstName} ${lastName}`,
        profileCompleted: true,
      },
    });

    return NextResponse.json(
      { message: "Perfil actualizado exitosamente", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
