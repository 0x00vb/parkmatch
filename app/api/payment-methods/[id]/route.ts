import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que el método de pago pertenece al usuario
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { message: "Método de pago no encontrado" },
        { status: 404 }
      );
    }

    await prisma.paymentMethod.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Método eliminado" }, { status: 200 });
  } catch (error: any) {
    console.error("Payment methods DELETE error:", error);
    return NextResponse.json(
      { message: "No se pudo eliminar el método" },
      { status: 400 }
    );
  }
}

const updateSchema = z.object({
  default: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    // Verificar que el método de pago pertenece al usuario
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { message: "Método de pago no encontrado" },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (data.default) {
        await tx.paymentMethod.updateMany({
          where: { userId: session.user!.id, default: true },
          data: { default: false },
        });
      }
      return tx.paymentMethod.update({
        where: { id },
        data: { default: data.default },
      });
    });

    return NextResponse.json({ method: updated }, { status: 200 });
  } catch (error: any) {
    console.error("Payment methods PATCH error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }
    return NextResponse.json({ message: "No se pudo actualizar" }, { status: 400 });
  }
}


