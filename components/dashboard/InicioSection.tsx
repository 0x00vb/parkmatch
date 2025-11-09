"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import {
  calculateDistance,
  filterByRadius,
  sortByDistance,
  Coordinates
} from "@/lib/geo";
import {
  SearchHeader,
  FiltersPanel,
  MapControls,
  ResultsModal
} from "./inicio";
import ActiveReservationModal from "@/components/reservations/ActiveReservationModal";
import { Reservation } from "@/types/reservation";

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex flex-1 items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando mapa...</p>
      </div>
    </div>
  )
});

interface ParkingSpot {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  type: "COVERED" | "UNCOVERED";
  price?: number;
  available: boolean;
}

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

interface SearchSuggestion {
  result: GeocodingResult;
  distance?: number;
}

export default function InicioSection() {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [filteredGarages, setFilteredGarages] = useState<Garage[]>([]);
  const [filteredParkingSpots, setFilteredParkingSpots] = useState<ParkingSpot[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: -34.6037, lng: -58.3816 }); // Buenos Aires
  const [zoom, setZoom] = useState(13);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [modalResults, setModalResults] = useState<Array<{ garage?: Garage; parkingSpot?: ParkingSpot; distance: number }>>([]);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [isReservationModalMinimized, setIsReservationModalMinimized] = useState(false);

  // Load garages from API
  useEffect(() => {
    const loadGarages = async () => {
      try {
        const response = await fetch('/api/garages?public=true');
        if (response.ok) {
          const data = await response.json();
          setGarages(data.garages);
        } else {
          console.error('Error loading garages:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching garages:', error);
      }
    };

    loadGarages();
  }, []);

  // Load user's active reservations
  useEffect(() => {
    const loadUserReservations = async () => {
      if (!session?.user?.id) return;

      try {
        // Get all user reservations
        const response = await fetch('/api/reservations');
        if (response.ok) {
          const data = await response.json();
          const reservations = data.reservations || [];
          setUserReservations(reservations);

          // Find reservations that should be active
          const now = new Date();
          const activeOrUpcoming = reservations.filter((reservation: Reservation) => {
            const startTime = new Date(reservation.startTime);
            const endTime = new Date(reservation.endTime);
            
            // Consider a reservation active if:
            // 1. It's confirmed and the start time is within 30 minutes
            // 2. It's already marked as active
            // 3. Current time is between start and end time
            const isWithin30Minutes = startTime.getTime() - now.getTime() <= 30 * 60 * 1000; // 30 minutes
            const isCurrentlyActive = now >= startTime && now <= endTime;
            
            return (reservation.status === 'CONFIRMED' && (isWithin30Minutes || isCurrentlyActive)) ||
                   reservation.status === 'ACTIVE';
          });

          if (activeOrUpcoming.length > 0) {
            const reservation = activeOrUpcoming[0];
            setActiveReservation(reservation);
            
            // Auto-update status to ACTIVE if it's time and still CONFIRMED
            const startTime = new Date(reservation.startTime);
            const endTime = new Date(reservation.endTime);
            const isCurrentlyActive = now >= startTime && now <= endTime;
            
            if (reservation.status === 'CONFIRMED' && isCurrentlyActive) {
              // Update status to ACTIVE
              fetch(`/api/reservations/${reservation.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ACTIVE' }),
              }).then(() => {
                // Refresh reservations after status update
                loadUserReservations();
              }).catch(console.error);
            }
            
            setShowReservationModal(true);
          } else {
            setActiveReservation(null);
            setShowReservationModal(false);
          }
        }
      } catch (error) {
        console.error('Error loading user reservations:', error);
      }
    };

    loadUserReservations();
    
    // Poll for updates every 60 seconds
    const interval = setInterval(loadUserReservations, 60000);
    
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  // Handle check-in for active reservation
  const handleCheckIn = async () => {
    if (!activeReservation) return;

    try {
      const response = await fetch(`/api/reservations/${activeReservation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (response.ok) {
        // Close modal and refresh reservations
        setShowReservationModal(false);
        setActiveReservation(null);
        // Optionally refresh the reservations list
        window.location.reload();
      }
    } catch (error) {
      console.error('Error during check-in:', error);
    }
  };

  // Handle cancellation of active reservation
  const handleCancelActiveReservation = async () => {
    if (!activeReservation) return;

    try {
      const response = await fetch(`/api/reservations/${activeReservation.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Close modal and refresh reservations
        setShowReservationModal(false);
        setActiveReservation(null);
        // Optionally refresh the reservations list
        window.location.reload();
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
    }
  };

  // Memoizar resultados filtrados por proximidad para mejor performance
  const { filteredGarages: memoizedFilteredGarages, filteredParkingSpots: memoizedFilteredParkingSpots } = useMemo(() => {
    if (!selectedLocation) {
      return {
        filteredGarages: garages,
        filteredParkingSpots: parkingSpots,
      };
    }

    const searchLocation: Coordinates = {
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
    };

    // Optimización: usar distancia aproximada para filtrado inicial (más rápido)
    const nearbyGarages = filterByRadius(garages, searchLocation, 5);
    const nearbyParkingSpots = filterByRadius(parkingSpots, searchLocation, 5);

    // Ordenar por distancia aproximada para mejor UX
    const sortedGarages = sortByDistance(nearbyGarages, searchLocation);
    const sortedParkingSpots = sortByDistance(nearbyParkingSpots, searchLocation);

    return {
      filteredGarages: sortedGarages,
      filteredParkingSpots: sortedParkingSpots,
    };
  }, [selectedLocation, garages, parkingSpots]);

  // Actualizar estado filtrado cuando cambian los resultados memoizados
  useEffect(() => {
    setFilteredGarages(memoizedFilteredGarages);
    setFilteredParkingSpots(memoizedFilteredParkingSpots);
  }, [memoizedFilteredGarages, memoizedFilteredParkingSpots]);

  // Centrar mapa cuando se selecciona una ubicación
  useEffect(() => {
    if (selectedLocation) {
      setMapCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
      setZoom(14);
    } else {
      // Resetear a vista general
      setMapCenter({ lat: -34.6037, lng: -58.3816 });
      setZoom(13);
    }
  }, [selectedLocation]);

  // Buscar sugerencias de geocoding cuando cambia la búsqueda debounced
  useEffect(() => {
    const searchLocations = async () => {
      if (!debouncedSearchQuery.trim() || debouncedSearchQuery.length < 3) {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/geocoding?q=${encodeURIComponent(debouncedSearchQuery)}&limit=5`
        );

        if (response.ok) {
          const data = await response.json();
          const suggestions: SearchSuggestion[] = data.results.map((result: GeocodingResult) => ({
            result,
            distance: undefined, // Se calculará si es necesario
          }));
          setSearchSuggestions(suggestions);
          setShowSuggestions(true);
        } else {
          console.error('Error fetching geocoding results:', response.statusText);
          setSearchSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error searching locations:', error);
        setSearchSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    };

    searchLocations();
  }, [debouncedSearchQuery]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleDebouncedSearchChange = useCallback((value: string) => {
    setDebouncedSearchQuery(value);
  }, []);

  const handleSelectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    const location = suggestion.result;
    const searchCoords: Coordinates = { lat: location.lat, lng: location.lng };

    // Filtrar garages y parking spots por proximidad (5km)
    const nearbyGarages = filterByRadius(garages, searchCoords, 5);
    const nearbyParkingSpots = filterByRadius(parkingSpots, searchCoords, 5);

    // Crear lista combinada con distancias
    const results: Array<{ garage?: Garage; parkingSpot?: ParkingSpot; distance: number }> = [];

    nearbyGarages.forEach(garage => {
      const distance = calculateDistance(searchCoords, { lat: garage.latitude, lng: garage.longitude });
      results.push({ garage, distance });
    });

    nearbyParkingSpots.forEach(spot => {
      const distance = calculateDistance(searchCoords, { lat: spot.latitude, lng: spot.longitude });
      results.push({ parkingSpot: spot, distance });
    });

    // Ordenar por distancia
    results.sort((a, b) => a.distance - b.distance);

    setSelectedLocation(location);
    setSearchQuery(location.displayName);
    setModalResults(results);
    setShowSuggestions(false);
    setShowResultsModal(true);
    setDebouncedSearchQuery(""); // Limpiar para evitar nuevas búsquedas
  }, [garages, parkingSpots]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setSelectedLocation(null);
    setSearchSuggestions([]);
    setShowSuggestions(false);
    setShowResultsModal(false);
    setModalResults([]);
    // Resetear mapa a vista general
    setMapCenter({ lat: -34.6037, lng: -58.3816 });
    setZoom(13);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowResultsModal(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchSuggestions.length > 0) {
      e.preventDefault();
      handleSelectSuggestion(searchSuggestions[0]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }, [searchSuggestions, handleSelectSuggestion]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 1, 20));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 1, 1));
  };

  const handleLocationClick = () => {
    // Check if we're on the client side and geolocation is available
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("La geolocalización no está soportada por este navegador.");
      return;
    }

    // Get user's current location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMapCenter(newCenter);
        setZoom(15);
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "No se pudo obtener tu ubicación.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += " Por favor, permite el acceso a la ubicación.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += " La ubicación no está disponible.";
            break;
          case error.TIMEOUT:
            errorMessage += " Se agotó el tiempo de espera.";
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleGarageClick = (garageId: string) => {
    router.push(`/garage/${garageId}`);
  };

  return (
    <div className="flex flex-col h-full flex-1 overflow-hidden">
      <SearchHeader
        searchQuery={searchQuery}
        debouncedSearchQuery={debouncedSearchQuery}
        showSuggestions={showSuggestions}
        searchSuggestions={searchSuggestions}
        isSearching={isSearching}
        selectedLocation={selectedLocation}
        showFilters={showFilters}
        onSearchChange={handleSearchChange}
        onDebouncedSearchChange={handleDebouncedSearchChange}
            onKeyDown={handleKeyDown}
        onSelectSuggestion={handleSelectSuggestion}
        onCloseSuggestions={() => setShowSuggestions(false)}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {/* Map Container */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <Map
          center={mapCenter}
          zoom={zoom}
          parkingSpots={filteredParkingSpots}
          garages={filteredGarages}
          onMapReady={() => setMapLoaded(true)}
          onGarageClick={handleGarageClick}
        />

        {/* Overlay para cerrar sugerencias al hacer click fuera */}
        {showSuggestions && (
          <div
            className="absolute inset-0 z-40"
            onClick={() => setShowSuggestions(false)}
          />
        )}

        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onLocationClick={handleLocationClick}
        />

      </div>

      <FiltersPanel
        showFilters={showFilters}
        onCloseFilters={() => setShowFilters(false)}
      />

      <ResultsModal
        showModal={showResultsModal}
        results={modalResults}
        onClose={handleCloseModal}
        onGarageClick={handleGarageClick}
        onParkingSpotClick={(lat, lng) => {
          setMapCenter({ lat, lng });
                            setZoom(18);
                            setShowResultsModal(false);
        }}
      />

      {/* Active Reservation Modal */}
      {showReservationModal && activeReservation && (
        <ActiveReservationModal
          reservation={activeReservation}
          onClose={() => setShowReservationModal(false)}
          onCheckIn={handleCheckIn}
          onCancel={handleCancelActiveReservation}
          isMinimized={isReservationModalMinimized}
          onMinimize={() => setIsReservationModalMinimized(true)}
          onExpand={() => setIsReservationModalMinimized(false)}
        />
      )}
    </div>
  );
}
