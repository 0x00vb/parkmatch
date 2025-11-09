/**
 * Utilidades geoespaciales para ParkMatch
 * Incluye cálculos de distancia, bounding boxes y validaciones de coordenadas
 */

/**
 * Interfaz para coordenadas geográficas
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calcula la distancia en kilómetros entre dos puntos usando la fórmula de Haversine
 * Más precisa para distancias cortas/medias
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Radio de la Tierra en kilómetros

  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLon = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Calcula distancia aproximada usando fórmula euclidiana
 * Más rápida pero menos precisa, útil para filtrado inicial
 */
export function calculateApproximateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const dLat = coord2.lat - coord1.lat;
  const dLon = coord2.lng - coord1.lng;

  // Factor de corrección aproximado para coordenadas (grados a km)
  const latKm = dLat * 111; // ~111km por grado de latitud
  const lonKm = dLon * 111 * Math.cos(toRadians(coord1.lat)); // Ajuste por latitud

  return Math.sqrt(latKm * latKm + lonKm * lonKm);
}

/**
 * Convierte grados a radianes
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Valida que las coordenadas estén dentro de rangos válidos
 */
export function isValidCoordinates(coord: Coordinates): boolean {
  return (
    coord.lat >= -90 && coord.lat <= 90 &&
    coord.lng >= -180 && coord.lng <= 180 &&
    !isNaN(coord.lat) && !isNaN(coord.lng)
  );
}

/**
 * Calcula un bounding box alrededor de un punto central
 * @param center Punto central
 * @param radiusKm Radio en kilómetros
 * @returns Bounding box como [south, north, west, east]
 */
export function calculateBoundingBox(center: Coordinates, radiusKm: number): [number, number, number, number] {
  // Aproximación: 1 grado ≈ 111km
  const latOffset = radiusKm / 111;
  const lngOffset = radiusKm / (111 * Math.cos(toRadians(center.lat)));

  const south = Math.max(-90, center.lat - latOffset);
  const north = Math.min(90, center.lat + latOffset);
  const west = Math.max(-180, center.lng - lngOffset);
  const east = Math.min(180, center.lng + lngOffset);

  return [south, north, west, east];
}

/**
 * Verifica si un punto está dentro de un radio específico
 */
export function isWithinRadius(center: Coordinates, point: Coordinates, radiusKm: number): boolean {
  const distance = calculateDistance(center, point);
  return distance <= radiusKm;
}

/**
 * Ordena puntos por distancia ascendente desde un punto de referencia
 */
export function sortByDistance<T extends { latitude: number; longitude: number }>(
  points: T[],
  reference: Coordinates
): T[] {
  return points.sort((a, b) => {
    const distA = calculateApproximateDistance(reference, { lat: a.latitude, lng: a.longitude });
    const distB = calculateApproximateDistance(reference, { lat: b.latitude, lng: b.longitude });
    return distA - distB;
  });
}

/**
 * Filtra puntos dentro de un radio específico
 */
export function filterByRadius<T extends { latitude: number; longitude: number }>(
  points: T[],
  center: Coordinates,
  radiusKm: number
): T[] {
  return points.filter(point =>
    isWithinRadius(center, { lat: point.latitude, lng: point.longitude }, radiusKm)
  );
}

/**
 * Encuentra el punto más cercano a una coordenada de referencia
 */
export function findClosestPoint<T extends { latitude: number; longitude: number }>(
  points: T[],
  reference: Coordinates
): T | null {
  if (points.length === 0) return null;

  let closest = points[0];
  let minDistance = calculateDistance(reference, { lat: closest.latitude, lng: closest.longitude });

  for (let i = 1; i < points.length; i++) {
    const distance = calculateDistance(reference, { lat: points[i].latitude, lng: points[i].longitude });
    if (distance < minDistance) {
      minDistance = distance;
      closest = points[i];
    }
  }

  return closest;
}
