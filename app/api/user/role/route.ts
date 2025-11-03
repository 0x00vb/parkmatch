import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["CONDUCTOR", "CONDUCTOR_PROPIETARIO"]),
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
    const { role } = updateRoleSchema.parse(body);

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role },
    });

    return NextResponse.json(
      { message: "Rol actualizado exitosamente", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Role update error:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
