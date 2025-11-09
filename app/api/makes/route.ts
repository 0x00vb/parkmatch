import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const makes = await prisma.$queryRaw`
      SELECT id, name
      FROM makes
      ORDER BY name ASC
    `;

    return NextResponse.json({ makes }, { status: 200 });
  } catch (error) {
    console.error("Error fetching makes:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
