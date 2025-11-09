import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const makeId = searchParams.get("make_id");

    if (!makeId) {
      return NextResponse.json(
        { message: "make_id es requerido" },
        { status: 400 }
      );
    }

    const models = await prisma.$queryRaw`
      SELECT id, name, length_mm, width_mm, height_mm
      FROM models
      WHERE make_id = ${parseInt(makeId)}
      ORDER BY name ASC
    `;

    return NextResponse.json({ models }, { status: 200 });
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
