import { useState, useCallback, useRef } from 'react';
import { calculateDistance, Coordinates, sortByDistance } from '@/lib/geo';

interface Garage {
  id: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  type: "COVERED" | "UNCOVERED";
  height: number;
  width: number;
  length: number;
  hasGate: boolean;
  hasCameras: boolean;
  accessType: "REMOTE_CONTROL" | "KEYS";
  hourlyPrice?: number;
  dailyPrice?: number;
  monthlyPrice?: number;
  createdAt: string;
  user: {
    name?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface SearchResult {
  garage: Garage;
  distance: number;
}

interface UseRealTimeParkingSearchReturn {
  searchNearbyGarages: (userLocation: Coordinates) => Promise<SearchResult[]>;
  isSearching: boolean;
  lastSearchTime: number | null;
  error: string | null;
}

const MAX_DISTANCE_KM = 3; // 3km máximo como solicitado
const SEARCH_COOLDOWN_MS = 30000; // 30 segundos entre búsquedas para evitar spam

export const useRealTimeParkingSearch = (garages: Garage[]): UseRealTimeParkingSearchReturn => {
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchTime, setLastSearchTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastLocationRef = useRef<Coordinates | null>(null);

  const searchNearbyGarages = useCallback(async (userLocation: Coordinates): Promise<SearchResult[]> => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Iniciando búsqueda en tiempo real...');
      console.log('📍 Ubicación actual:', userLocation);
    }

    // Validar que tengamos ubicación
    if (!userLocation) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ No hay ubicación disponible');
      }
      setError('Ubicación no disponible. Activa la geolocalización.');
      return [];
    }

    // Validar que no sea demasiado pronto para otra búsqueda
    const now = Date.now();
    if (lastSearchTime && (now - lastSearchTime) < SEARCH_COOLDOWN_MS) {
      const remainingTime = Math.ceil((SEARCH_COOLDOWN_MS - (now - lastSearchTime)) / 1000);
      if (process.env.NODE_ENV === 'development') {
        console.log('⏱️ Cooldown activo, faltan', remainingTime, 'segundos');
      }
      setError(`Espera ${remainingTime} segundos antes de buscar nuevamente.`);
      return [];
    }

    // Para búsquedas estáticas, permitir búsqueda cada 10 segundos en lugar de requerir movimiento
    if (lastLocationRef.current) {
      const distanceFromLastSearch = calculateDistance(lastLocationRef.current, userLocation);
      const timeSinceLastSearch = lastSearchTime ? now - lastSearchTime : 0;

      // Si han pasado más de 10 segundos desde la última búsqueda, permitir búsqueda estática
      if (distanceFromLastSearch < 0.1 && timeSinceLastSearch < 10000) { // 10 segundos
        if (process.env.NODE_ENV === 'development') {
          console.log('📍 Ubicación no cambió significativamente, pero tiempo suficiente para búsqueda estática');
        }
        // No bloqueamos, permitimos la búsqueda
      } else if (distanceFromLastSearch >= 0.1) {
        if (process.env.NODE_ENV === 'development') {
          console.log('📍 Ubicación cambió', distanceFromLastSearch.toFixed(2), 'km desde la última búsqueda');
        }
      }
    }

    setIsSearching(true);
    setError(null);

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🏢 Buscando garages cercanos. Total garages disponibles:', garages.length);
      }

      // Filtrar y ordenar garages dentro del radio máximo en una sola pasada
      const garageDistances: Array<{ garage: Garage; distance: number }> = [];

      for (const garage of garages) {
        const garageLocation: Coordinates = {
          lat: garage.latitude,
          lng: garage.longitude
        };
        const distance = calculateDistance(userLocation, garageLocation);

        if (distance <= MAX_DISTANCE_KM) {
          garageDistances.push({ garage, distance });
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Garage encontrado: ${garage.address} - ${distance.toFixed(2)}km`);
          }
        }
      }

      // Ordenar por distancia ascendente
      garageDistances.sort((a, b) => a.distance - b.distance);

      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Garages encontrados dentro de 3km:', garageDistances.length);
      }

      // Crear resultados finales
      const results: SearchResult[] = garageDistances;

      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 Resultados finales:', results.length);
      }

      // Actualizar estado
      setLastSearchTime(now);
      lastLocationRef.current = userLocation;

      return results;

    } catch (err) {
      console.error('❌ Error en búsqueda de cocheras:', err);
      setError('Error al buscar cocheras cercanas.');
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [garages, lastSearchTime]);

  return {
    searchNearbyGarages,
    isSearching,
    lastSearchTime,
    error
  };
};
