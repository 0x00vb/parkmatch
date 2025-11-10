import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPaymentMethodSchema = z.object({
  brand: z.string().min(2),
  last4: z.string().length(4),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int().min(2000).max(2100),
  holderName: z.string().min(2).optional(),
  network: z.string().optional(),
  default: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const methods = await prisma.paymentMethod.findMany({
      where: { userId: session.user.id },
      orderBy: [{ default: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ methods }, { status: 200 });
  } catch (error: any) {
    console.error("Payment methods GET error:", error);
    // If model/table doesn't exist yet (migration pending), respond gracefully
    return NextResponse.json(
      { message: "Servicio de métodos de pago no disponible. Ejecute migraciones." },
      { status: 501 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = createPaymentMethodSchema.parse(body);

    // Verify the user exists in the database
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user!.id }
    });

    if (!dbUser) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    // Ensure only one default; use transaction if default requested

    const created = await prisma.$transaction(async (tx) => {
      if (data.default) {
        await tx.paymentMethod.updateMany({
          where: { userId: session.user!.id, default: true },
          data: { default: false },
        });
      }
      const method = await tx.paymentMethod.create({
        data: {
          userId: session.user!.id,
          brand: data.brand,
          last4: data.last4,
          expMonth: data.expMonth,
          expYear: data.expYear,
          holderName: data.holderName,
          network: data.network,
          default: data.default ?? false,
        },
      });
      return method;
    });

    return NextResponse.json({ method: created }, { status: 201 });
  } catch (error: any) {
    console.error("Payment methods POST error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Datos inválidos", errors: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Servicio de métodos de pago no disponible. Ejecute migraciones." },
      { status: 501 }
    );
  }
}


