import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandling, logInfo } from "@/lib/errors";
import { requireOwner } from "@/lib/auth-middleware";
import { z } from "zod";

const updateGarageSchema = z.object({
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  type: z.enum(["COVERED", "UNCOVERED"]).optional(),
  height: z.number().min(1.5).max(5).optional(),
  width: z.number().min(1.5).max(5).optional(),
  length: z.number().min(3).max(10).optional(),
  hasGate: z.boolean().optional(),
  hasCameras: z.boolean().optional(),
  accessType: z.enum(["REMOTE_CONTROL", "KEYS"]).optional(),
  rules: z.string().optional(),
  hourlyPrice: z.number().min(0).optional(),
  dailyPrice: z.number().min(0).optional(),
  monthlyPrice: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

async function getGarage(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireOwner(request);
  const { id } = await params;
  
  logInfo("Fetching garage details", {
    garageId: id,
    userId: session?.user?.id
  });

  // Verify the garage belongs to the user
  const garage = await prisma.garage.findFirst({
    where: {
      id: id,
      userId: session!.user.id,
    },
  });

  if (!garage) {
    return NextResponse.json(
      { message: "Cochera no encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { garage },
    { status: 200 }
  );
}

async function updateGarage(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireOwner(request);
  const { id } = await params;
  
  logInfo("Updating garage", {
    garageId: id,
    userId: session?.user?.id
  });

  // Verify the garage belongs to the user
  const existingGarage = await prisma.garage.findFirst({
    where: {
      id: id,
      userId: session!.user.id,
    },
  });

  if (!existingGarage) {
    return NextResponse.json(
      { message: "Cochera no encontrada" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const updateData = updateGarageSchema.parse(body);

  const updatedGarage = await prisma.garage.update({
    where: { id: id },
    data: updateData,
  });

  logInfo("Garage updated successfully", {
    garageId: id,
    userId: session!.user.id,
    updatedFields: Object.keys(updateData)
  });

  return NextResponse.json(
    { message: "Cochera actualizada exitosamente", garage: updatedGarage },
    { status: 200 }
  );
}

async function deleteGarage(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireOwner(request);
  const { id } = await params;
  
  logInfo("Deleting garage", {
    garageId: id,
    userId: session?.user?.id
  });

  // Verify the garage belongs to the user
  const garage = await prisma.garage.findFirst({
    where: {
      id: id,
      userId: session!.user.id,
    },
  });

  if (!garage) {
    return NextResponse.json(
      { message: "Cochera no encontrada" },
      { status: 404 }
    );
  }

  // TODO: In the future, check if garage has active reservations
  // and prevent deletion if there are any

  await prisma.garage.delete({
    where: { id: id },
  });

  logInfo("Garage deleted successfully", {
    garageId: id,
    userId: session!.user.id
  });

  return NextResponse.json(
    { message: "Cochera eliminada exitosamente" },
    { status: 200 }
  );
}

export const GET = withErrorHandling(getGarage);
export const PATCH = withErrorHandling(updateGarage);
export const DELETE = withErrorHandling(deleteGarage);