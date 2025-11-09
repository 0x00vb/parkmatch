import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { hybridCache } from "@/lib/cache";
import { z } from "zod";
import { createErrorResponse } from "@/lib/errors";

const geocodingSchema = z.object({
  q: z.string().min(1).max(200).trim(),
  limit: z.number().min(1).max(10).optional().default(5),
  countrycodes: z.string().optional().default("AR"), // Limitar a Argentina por defecto
});

interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  address: {
    houseNumber?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

/**
 * Función para geocoding usando Nominatim API (OpenStreetMap)
 * Implementa caching y rate limiting para optimización
 */
async function fetchGeocodingResults(query: string, limit: number, countryCodes: string): Promise<GeocodingResult[]> {
  const cacheKey = `geocoding:${query}:${limit}:${countryCodes}`;

  return hybridCache(
    cacheKey,
    1800, // Cache por 30 minutos
    async () => {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=${limit}&countrycodes=${countryCodes}&addressdetails=1&accept-language=es`;

      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'ParkMatch/1.0 (https://parkmatch.com)',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Nominatim API error: ${response.status}`);
        }

        const data: NominatimResult[] = await response.json();

        return data.map((result): GeocodingResult => ({
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          displayName: result.display_name,
          address: {
            houseNumber: result.address?.house_number,
            road: result.address?.road,
            suburb: result.address?.suburb,
            city: result.address?.city,
            state: result.address?.state,
            postcode: result.address?.postcode,
            country: result.address?.country,
          },
        }));
      } catch (error) {
        console.error('Geocoding API error:', error);
        throw new Error('Error al buscar la ubicación');
      }
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting para búsquedas públicas
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
    await rateLimit(clientIP, 'public');

    const { searchParams } = new URL(request.url);

    // Validar parámetros de entrada
    const validationResult = geocodingSchema.safeParse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      countrycodes: searchParams.get('countrycodes') || undefined,
    });

    if (!validationResult.success) {
      return createErrorResponse(400, 'Parámetros de búsqueda inválidos');
    }

    const { q, limit, countrycodes } = validationResult.data;

    // Buscar resultados de geocoding
    const results = await fetchGeocodingResults(q, limit, countrycodes);

    return NextResponse.json({
      results,
      query: q,
      total: results.length,
    });

  } catch (error) {
    console.error('Geocoding error:', error);

    if (error instanceof Error && error.message === 'Error al buscar la ubicación') {
      return createErrorResponse(503, 'Servicio de geocoding no disponible');
    }

    return createErrorResponse(500, 'Error interno del servidor');
  }
}
