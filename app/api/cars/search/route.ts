import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const year = searchParams.get("year");

    if (!make) {
      return NextResponse.json(
        { message: "Marca es requerida" },
        { status: 400 }
      );
    }

    const params: any = { make };
    if (model) params.model = model;
    if (year) params.year = parseInt(year);

    const response = await axios.get("https://api.api-ninjas.com/v1/cars", {
      headers: {
        "X-Api-Key": process.env.CARS_API_KEY || "demo-key",
      },
      params,
    });

    return NextResponse.json({ cars: response.data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching car data:", error);
    return NextResponse.json(
      { message: "Error al buscar información del vehículo" },
      { status: 500 }
    );
  }
}
