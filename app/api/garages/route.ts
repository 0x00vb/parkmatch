import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createGarageSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  type: z.enum(["COVERED", "UNCOVERED"]),
  height: z.number().min(1.5).max(5),
  width: z.number().min(1.5).max(5),
  length: z.number().min(3).max(10),
  hasGate: z.boolean(),
  hasCameras: z.boolean(),
  accessType: z.enum(["REMOTE_CONTROL", "KEYS"]),
  rules: z.string().optional(),
  images: z.array(z.string()).min(1).max(3),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const garageData = createGarageSchema.parse(body);

    const garage = await prisma.garage.create({
      data: {
        ...garageData,
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      { message: "Cochera creada exitosamente", garage },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating garage:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const garages = await prisma.garage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ garages }, { status: 200 });
  } catch (error) {
    console.error("Error fetching garages:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
