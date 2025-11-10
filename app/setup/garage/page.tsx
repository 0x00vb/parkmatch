"use client";

import { useState, useEffect, useRef } from "react";

// This page should not be prerendered due to Leaflet components and sessionStorage usage
export const runtime = 'edge';
import { useRouter } from "next/navigation";
import dynamicImport from "next/dynamic";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamicImport(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamicImport(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamicImport(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamicImport(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

// Import Icon statically since it's needed for icon creation
import { Icon } from "leaflet";
import axios from "axios";
import { MapPinIcon } from "@heroicons/react/24/outline";
import ProgressBar from "@/components/ui/ProgressBar";
import { useSession } from "next-auth/react";
import "leaflet/dist/leaflet.css";

interface LocationData {
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}

export default function GarageLocationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [locationData, setLocationData] = useState<LocationData>({
    address: "",
    city: "Ciudad Autónoma de Buenos Aires",
    latitude: -34.6037,
    longitude: -58.3816,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isFromDashboard, setIsFromDashboard] = useState(false);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Verificar que el usuario tenga rol de propietario
  useEffect(() => {
    if (session?.user?.role === "CONDUCTOR") {
      router.push("/dashboard");
    }
  }, [session?.user?.role, router]);

  useEffect(() => {
    // Only access window/sessionStorage on client side
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setNextStep(urlParams.get('next'));

      // Check if coming from dashboard
      const garageSource = sessionStorage.getItem("garageSource");
      setIsFromDashboard(garageSource === "dashboard");
    }
  }, []);

  useEffect(() => {
    setMapLoaded(true);
  }, []);

  // Early returns must happen after all hooks are called
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Función para buscar direcciones usando Nominatim
  const searchAddress = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query + ', Argentina',
          format: 'json',
          limit: 5,
          countrycodes: 'AR',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'ParkMatch/1.0'
        }
      });

      setSearchResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching address:', error);
      setSearchResults([]);
    }
  };

  // Función para geocoding inverso usando Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat,
          lon: lng,
          format: 'json',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'ParkMatch/1.0'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  };

  // Función para manejar selección de dirección
  const handleAddressSelect = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    // Extraer ciudad de la respuesta
    let city = "Ciudad Autónoma de Buenos Aires";
    if (result.address) {
      if (result.address.city) {
        city = result.address.city;
      } else if (result.address.town) {
        city = result.address.town;
      } else if (result.address.village) {
        city = result.address.village;
      } else if (result.address.state) {
        city = result.address.state;
      }
    }

    setLocationData({
      address: result.display_name,
      city,
      latitude: lat,
      longitude: lng,
    });

    // Actualizar marcador
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }

    // Centrar mapa
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15);
    }

    setShowResults(false);
    if (addressInputRef.current) {
      addressInputRef.current.value = result.display_name;
    }
  };

  // Función para manejar movimiento del marcador
  const handleMarkerDrag = async (event: any) => {
    const { lat, lng } = event.target.getLatLng();

    setLocationData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

    // Geocoding inverso para obtener dirección
    const result = await reverseGeocode(lat, lng);
    if (result && addressInputRef.current) {
      addressInputRef.current.value = result.display_name;
      setLocationData(prev => ({
        ...prev,
        address: result.display_name,
      }));
    }
  };

  // Componente para el mapa con eventos
  const MapComponent = () => {
    const [MapEventsComponent, setMapEventsComponent] = useState<React.ComponentType | null>(null);

    useEffect(() => {
      // Dynamically import useMapEvents on client side
      import("react-leaflet").then(({ useMapEvents: useMapEventsHook }) => {
        const EventsComponent = () => {
          const map = useMapEventsHook({
            click: (e: any) => {
              const { lat, lng } = e.latlng;
              setLocationData(prev => ({
                ...prev,
                latitude: lat,
                longitude: lng,
              }));

              if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
              }

              // Geocoding inverso
              reverseGeocode(lat, lng).then(result => {
                if (result && addressInputRef.current) {
                  addressInputRef.current.value = result.display_name;
                  setLocationData(prev => ({
                    ...prev,
                    address: result.display_name,
                  }));
                }
              });
            },
          });

          useEffect(() => {
            mapRef.current = map;
          }, [map]);

          return null;
        };

        setMapEventsComponent(() => EventsComponent);
      });
    }, []);

    return MapEventsComponent ? <MapEventsComponent /> : null;
  };

  // Crear ícono personalizado para el marcador
  const customIcon = new Icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#10B981" stroke="white" stroke-width="3"/>
      </svg>
    `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

  const handleContinue = () => {
    if (!locationData.address.trim()) {
      alert("Por favor ingresá una dirección válida");
      return;
    }

    // Store location data in sessionStorage for next step
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("garageLocation", JSON.stringify(locationData));
      // Store next step info
      if (nextStep) {
        sessionStorage.setItem("garageNextStep", nextStep);
      }
    }
    router.push("/setup/garage/details");
  };

  const handleSkip = () => {
    if (nextStep === "vehicles") {
      // Skip garage setup and go to vehicles
      router.push("/setup/vehicles?from=garage");
    } else {
      // Skip garage setup and go to completion
      router.push("/setup/complete");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-sm md:max-w-2xl lg:max-w-4xl bg-white min-h-screen md:min-h-0 md:my-8 md:rounded-2xl md:shadow-xl">
        <div className="px-6 md:px-8 lg:px-12 pt-8 md:pt-6 lg:pt-8">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-medium text-gray-900 mb-4">Publicar un espacio</h1>
            <ProgressBar currentStep={1} totalSteps={6} className="mb-6" />
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¿Dónde está tu espacio?
            </h2>
          </div>

          {/* Address Input */}
          <div className="mb-4 relative">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <div className="relative">
              <input
                ref={addressInputRef}
                type="text"
                id="address"
                placeholder="Ej: Av. Corrientes 1234"
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                onChange={(e) => searchAddress(e.target.value)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowResults(true);
                }}
              />
              <MapPinIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
                    onClick={() => handleAddressSelect(result)}
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {result.display_name.split(',')[0]}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {result.display_name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* City Input */}
          <div className="mb-6">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              Ciudad
            </label>
            <div className="relative">
              <input
                type="text"
                id="city"
                value={locationData.city}
                onChange={(e) => setLocationData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                readOnly
              />
              <svg className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Map Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Confirmar en el mapa</h3>
            <div className="w-full h-48 md:h-64 lg:h-80 bg-gray-200 rounded-xl overflow-hidden relative">
              {mapLoaded && typeof window !== 'undefined' ? (
                <MapContainer
                  center={[locationData.latitude, locationData.longitude]}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapComponent />
                  <Marker
                    position={[locationData.latitude, locationData.longitude]}
                    icon={customIcon}
                    draggable={true}
                    eventHandlers={{
                      dragend: handleMarkerDrag,
                    }}
                    ref={markerRef}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>Tu ubicación</strong><br />
                        {locationData.address}
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Cargando mapa...</p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Podés arrastrar el marcador o hacer clic en el mapa para ajustar la ubicación exacta
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 md:flex md:space-y-0 md:space-x-4 md:justify-end pb-0 md:pb-8">
            <button
              onClick={handleContinue}
              disabled={!locationData.address.trim() || isLoading}
              className="w-full md:w-auto md:min-w-[200px] bg-green-500 text-white font-semibold py-4 px-6 rounded-2xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Cargando..." : "Siguiente"}
            </button>
            
            {/* Skip Button - only show if not coming from dashboard */}
            {!isFromDashboard && (
              <button
                onClick={handleSkip}
                className="w-full md:w-auto md:min-w-[200px] border border-gray-300 text-gray-700 font-medium py-4 px-6 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Omitir por ahora
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
