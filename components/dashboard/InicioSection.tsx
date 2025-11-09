"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  MinusIcon,
  MapPinIcon
} from "@heroicons/react/24/outline";

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

export default function InicioSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: -34.6037, lng: -58.3816 }); // Buenos Aires
  const [zoom, setZoom] = useState(13);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Mock data for now - will be replaced with API call
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
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Searching for:", searchQuery);
  };

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

  return (
    <div className="flex flex-col h-screen">
      {/* Search Header */}
      <div className="bg-white p-4 shadow-sm shrink-0">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar dirección, barrio o punto de interés"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </form>

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
      <div className="flex-1 relative min-h-0">
        <Map
          center={mapCenter}
          zoom={zoom}
          parkingSpots={parkingSpots}
          onMapReady={() => setMapLoaded(true)}
        />

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

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 z-10">
          <div className="text-xs font-medium text-gray-700 mb-2">Leyenda</div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Cubierto disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Descubierto disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">No disponible</span>
            </div>
          </div>
        </div>
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
    </div>
  );
}
