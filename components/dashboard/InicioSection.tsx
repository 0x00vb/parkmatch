"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  MinusIcon,
  MapPinIcon,
  XMarkIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import DebouncedInput from "@/components/ui/DebouncedInput";
import {
  calculateDistance,
  filterByRadius,
  sortByDistance,
  Coordinates
} from "@/lib/geo";

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
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

  // Mock data for parking spots for now - will be replaced with API call later
  useEffect(() => {
    const mockSpots: ParkingSpot[] = [
      {
        id: "1",
        latitude: -34.6037,
        longitude: -58.3816,
        address: "Av. Corrientes 1234",
        type: "COVERED",
        price: 500,
        available: true,
      },
      {
        id: "2",
        latitude: -34.6047,
        longitude: -58.3826,
        address: "Av. Santa Fe 5678",
        type: "UNCOVERED",
        price: 300,
        available: true,
      },
      {
        id: "3",
        latitude: -34.6027,
        longitude: -58.3806,
        address: "Av. Rivadavia 9012",
        type: "COVERED",
        price: 450,
        available: false,
      },
    ];
    setParkingSpots(mockSpots);
    setFilteredParkingSpots(mockSpots);
  }, []);

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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search Header */}
      <div className="bg-white p-4 shadow-sm shrink-0 ">
        <div className="mb-4 relative">
          <DebouncedInput
            value={searchQuery}
            onChange={handleSearchChange}
            onDebouncedChange={handleDebouncedSearchChange}
            onKeyDown={handleKeyDown}
            placeholder="Buscar dirección, barrio o punto de interés"
            debounceMs={300}
            maxLength={200}
            aria-label="Buscar ubicación"
            showClearButton={!!selectedLocation}
          />

          {/* Indicador de ubicación seleccionada */}
          {selectedLocation && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 font-medium">Seleccionada</span>
            </div>
          )}

          {/* Indicador de búsqueda */}
          {isSearching && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
            </div>
          )}

          {/* Sugerencias de búsqueda */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.result.displayName}
                      </div>
                      {suggestion.result.address.city && (
                        <div className="text-xs text-gray-500 truncate">
                          {suggestion.result.address.city}
                          {suggestion.result.address.state && `, ${suggestion.result.address.state}`}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Mensaje cuando no hay resultados */}
          {showSuggestions && searchSuggestions.length === 0 && !isSearching && debouncedSearchQuery.length >= 3 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 mt-1">
              <div className="text-sm text-gray-500 text-center">
                No se encontraron ubicaciones para &quot;{debouncedSearchQuery}&quot;
              </div>
            </div>
          )}

        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-full text-sm font-medium whitespace-nowrap"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            Filtros
          </button>
          <button className="px-3 py-2 bg-gray-100 rounded-full text-sm font-medium whitespace-nowrap">
            Ahora
          </button>
          <button className="px-3 py-2 bg-gray-100 rounded-full text-sm font-medium whitespace-nowrap">
            Auto
          </button>
          <button className="px-3 py-2 bg-gray-100 rounded-full text-sm font-medium whitespace-nowrap">
            Hasta $500
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative min-h-0 overflow-hidden">
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

        {/* Map Controls */}
        <div className="absolute right-4 top-4 flex flex-col gap-2 z-10">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
          >
            <PlusIcon className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
          >
            <MinusIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Location Button */}
        <button
          onClick={handleLocationClick}
          className="absolute right-4 bottom-4 w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 z-10"
        >
          <MapPinIcon className="h-6 w-6 text-gray-600" />
        </button>

      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de cochera
              </label>
              <select className="w-full p-2 border border-gray-300 rounded-md">
                <option value="">Cualquiera</option>
                <option value="COVERED">Cubierta</option>
                <option value="UNCOVERED">Descubierta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio máximo
              </label>
              <input
                type="number"
                placeholder="$500"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md font-medium">
              Aplicar filtros
            </button>
            <button 
              onClick={() => setShowFilters(false)}
              className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-md font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="w-full max-w-sm bg-white rounded-t-2xl max-h-1/2 overflow-hidden shadow-xl transform transition-transform duration-300 ease-out">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <button
                onClick={handleCloseModal}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Volver</span>
              </button>
              <div className="text-sm font-medium text-gray-900">
                Cocheras cercanas
              </div>
              <div className="w-16" /> {/* Spacer for centering */}
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto max-h-96">
              {modalResults.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {modalResults.map((result, index) => {
                    const item = result.garage || result.parkingSpot!;
                    const isGarage = !!result.garage;

                    return (
                      <div
                        key={`${isGarage ? 'garage' : 'spot'}-${item.id}`}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          if (isGarage) {
                            handleGarageClick(item.id);
                          } else {
                            // Handle parking spot click (could navigate to details or show on map)
                            setMapCenter({ lat: item.latitude, lng: item.longitude });
                            setZoom(18);
                            setShowResultsModal(false);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="shrink-0">
                            {isGarage ? (
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <div className="w-6 h-6 bg-blue-500 rounded"></div>
                              </div>
                            ) : (
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                (item as ParkingSpot).available
                                  ? (item as ParkingSpot).type === "COVERED"
                                    ? "bg-green-100"
                                    : "bg-orange-100"
                                  : "bg-red-100"
                              }`}>
                                <div className={`w-6 h-6 rounded ${
                                  (item as ParkingSpot).available
                                    ? (item as ParkingSpot).type === "COVERED"
                                      ? "bg-green-500"
                                      : "bg-orange-500"
                                    : "bg-red-500"
                                }`}></div>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                  {item.address}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500">
                                    {result.distance < 1
                                      ? `${(result.distance * 1000).toFixed(0)}m`
                                      : `${result.distance.toFixed(1)}km`
                                    }
                                  </span>
                                  {isGarage ? (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                      Cochera
                                    </span>
                                  ) : (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      (item as ParkingSpot).available
                                        ? (item as ParkingSpot).type === "COVERED"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-orange-100 text-orange-800"
                                        : "bg-red-100 text-red-800"
                                    }`}>
                                      {(item as ParkingSpot).available ? "Disponible" : "Ocupado"}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {isGarage && result.garage?.hourlyPrice && (
                                <div className="shrink-0 ml-2">
                                  <span className="text-sm font-semibold text-green-600">
                                    ${result.garage.hourlyPrice}/h
                                  </span>
                                </div>
                              )}
                            </div>

                            {isGarage && result.garage && (
                              <div className="flex items-center gap-2 mt-2">
                                {result.garage.hasGate && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                    Portón
                                  </span>
                                )}
                                {result.garage.hasCameras && (
                                  <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                                    Cámaras
                                  </span>
                                )}
                                <span className="text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
                                  {result.garage.accessType === "REMOTE_CONTROL" ? "Control remoto" : "Llaves"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <MapPinIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay cocheras cerca de esta ubicación
                  </h3>
                  <p className="text-sm text-gray-500">
                    Intenta buscar en otra ubicación o amplía tu búsqueda
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
