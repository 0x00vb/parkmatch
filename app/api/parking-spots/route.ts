import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling, logInfo } from "@/lib/errors";
import { requireAuth } from "@/lib/auth-middleware";

async function getParkingSpots(request: NextRequest) {
  await requireAuth(request);

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius") || "5";
  const type = searchParams.get("type");
  const maxPrice = searchParams.get("maxPrice");

  logInfo("Fetching parking spots", {
    lat,
    lng,
    radius,
    type,
    maxPrice
  });

  // Build where clause for filtering
  const whereClause: any = {
    isActive: true,
  };

  if (type && ['COVERED', 'UNCOVERED'].includes(type)) {
    whereClause.type = type;
  }

  // TODO: Implement geospatial queries for radius filtering
  const garages = await prisma.garage.findMany({
    where: whereClause,
    select: {
      id: true,
      address: true,
      city: true,
      latitude: true,
      longitude: true,
      type: true,
      height: true,
      width: true,
      length: true,
      hasGate: true,
      hasCameras: true,
      accessType: true,
      images: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    },
    take: 50, // Limit results
  });

  // Transform data for frontend
  const parkingSpots = garages.map(garage => ({
    id: garage.id,
    latitude: garage.latitude,
    longitude: garage.longitude,
    address: garage.address,
    city: garage.city,
    type: garage.type,
    dimensions: {
      height: garage.height,
      width: garage.width,
      length: garage.length,
    },
    features: {
      hasGate: garage.hasGate,
      hasCameras: garage.hasCameras,
      accessType: garage.accessType,
    },
    images: garage.images,
    owner: {
      name: garage.user.firstName && garage.user.lastName
        ? `${garage.user.firstName} ${garage.user.lastName}`
        : "Propietario",
    },
    available: true, // TODO: Check actual availability based on reservations
    price: Math.floor(Math.random() * 500) + 200, // Mock price for now
  }));

  return NextResponse.json({ parkingSpots });
}

export const GET = withErrorHandling(getParkingSpots);

async function createParkingSpotReservation(request: NextRequest) {
  await requireAuth(request);

  // TODO: Implement creating/reserving parking spots
  logInfo("Parking spot reservation creation attempted - not implemented yet");

  return NextResponse.json(
    { message: "Funcionalidad no implementada aún" },
    { status: 501 }
  );
}

export const POST = withErrorHandling(createParkingSpotReservation);
