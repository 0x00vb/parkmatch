import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import * as bcrypt from "bcrypt";

const updateProfileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(10),
  currentPassword: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        name: true,
        role: true,
        emailVerified: true,
        profileCompleted: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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
    const { firstName, lastName, phone, currentPassword } = updateProfileSchema.parse(body);

    // Get current user data to check if sensitive fields changed
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        phone: true,
        password: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Validate password if phone number is being changed (sensitive field)
    // Only require password if user already has a phone number (not initial setup)
    if (phone !== currentUser.phone && currentUser.phone !== null) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: "Se requiere contraseña actual para cambiar el teléfono" },
          { status: 400 }
        );
      }

      // If user doesn't have a password (OAuth user), skip password validation
      if (currentUser.password) {
        const isValidPassword = await bcrypt.compare(currentPassword, currentUser.password);
        if (!isValidPassword) {
          return NextResponse.json(
            { message: "Contraseña actual incorrecta" },
            { status: 400 }
          );
        }
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        phone,
        name: `${firstName} ${lastName}`,
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
