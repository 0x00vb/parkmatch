"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@googlemaps/js-api-loader";
import { MapPinIcon } from "@heroicons/react/24/outline";
import ProgressBar from "@/components/ui/ProgressBar";

interface LocationData {
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}

export default function GarageLocationPage() {
  const [locationData, setLocationData] = useState<LocationData>({
    address: "",
    city: "Ciudad Autónoma de Buenos Aires",
    latitude: -34.6037,
    longitude: -58.3816,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    try {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "demo-key",
        version: "weekly",
        libraries: ["places", "geometry"],
      });

      await loader.load();
      
      if (mapRef.current) {
        // Initialize map
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: locationData.latitude, lng: locationData.longitude },
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current = map;

        // Initialize marker
        const marker = new google.maps.Marker({
          position: { lat: locationData.latitude, lng: locationData.longitude },
          map: map,
          draggable: true,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#10B981",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
            scale: 8,
          },
        });

        markerRef.current = marker;

        // Initialize autocomplete
        if (addressInputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(
            addressInputRef.current,
            {
              types: ["address"],
              componentRestrictions: { country: "AR" },
              fields: ["formatted_address", "geometry", "address_components"],
            }
          );

          autocompleteRef.current = autocomplete;

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry?.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              
              // Extract city from address components
              let city = "Ciudad Autónoma de Buenos Aires";
              if (place.address_components) {
                const cityComponent = place.address_components.find(
                  component => component.types.includes("locality") || 
                              component.types.includes("administrative_area_level_1")
                );
                if (cityComponent) {
                  city = cityComponent.long_name;
                }
              }

              setLocationData({
                address: place.formatted_address || "",
                city,
                latitude: lat,
                longitude: lng,
              });

              // Update map and marker
              map.setCenter({ lat, lng });
              marker.setPosition({ lat, lng });
            }
          });
        }

        // Handle marker drag
        marker.addListener("dragend", () => {
          const position = marker.getPosition();
          if (position) {
            const lat = position.lat();
            const lng = position.lng();
            
            setLocationData(prev => ({
              ...prev,
              latitude: lat,
              longitude: lng,
            }));

            // Reverse geocoding to get address
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === "OK" && results?.[0] && addressInputRef.current) {
                addressInputRef.current.value = results[0].formatted_address;
                setLocationData(prev => ({
                  ...prev,
                  address: results[0].formatted_address,
                }));
              }
            });
          }
        });

        setMapLoaded(true);
      }
    } catch (error) {
      console.error("Error loading Google Maps:", error);
    }
  };

  const handleContinue = () => {
    if (!locationData.address.trim()) {
      alert("Por favor ingresá una dirección válida");
      return;
    }

    // Store location data in sessionStorage for next step
    sessionStorage.setItem("garageLocation", JSON.stringify(locationData));
    router.push("/setup/garage/details");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-sm bg-white min-h-screen">
        <div className="px-6 pt-8">
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
            <ProgressBar currentStep={0} totalSteps={4} className="mb-6" />
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¿Dónde está tu espacio?
            </h2>
          </div>

          {/* Address Input */}
          <div className="mb-4">
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
              />
              <MapPinIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
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
            <div className="w-full h-48 bg-gray-200 rounded-xl overflow-hidden relative">
              <div ref={mapRef} className="w-full h-full" />
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Cargando mapa...</p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Podés arrastrar el marcador para ajustar la ubicación exacta
            </p>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!locationData.address.trim() || isLoading}
            className="w-full bg-green-500 text-white font-semibold py-4 px-6 rounded-2xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Cargando..." : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}
