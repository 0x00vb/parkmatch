"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LatLngExpression } from "leaflet";
import { configureLeaflet, createParkingIcon } from "@/lib/leaflet-config";

// Dynamically import map components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

// Dynamically import MapController
const MapController = dynamic(() => import("./MapController"), { ssr: false });

interface ParkingSpot {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  type: "COVERED" | "UNCOVERED";
  price?: number;
  available: boolean;
}

interface MapProps {
  center: { lat: number; lng: number };
  zoom: number;
  parkingSpots: ParkingSpot[];
  onMapReady?: () => void;
}

export default function Map({ center, zoom, parkingSpots, onMapReady }: MapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Configure leaflet on client side
    configureLeaflet();
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px]">
      <MapContainer
        center={[center.lat, center.lng] as LatLngExpression}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={false}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
        scrollWheelZoom={true}
        dragging={true}
        touchZoom={true}
      >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController zoom={zoom} center={center} onMapReady={onMapReady} />

      {/* Parking Spot Markers */}
      {parkingSpots.map((spot) => {
        const markerColor = spot.available
          ? spot.type === "COVERED"
            ? "green"
            : "orange"
          : "red";

        const customIcon = createParkingIcon(markerColor);

        if (!customIcon) return null;

        return (
          <Marker
            key={spot.id}
            position={[spot.latitude, spot.longitude] as LatLngExpression}
            icon={customIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>{spot.address}</strong><br />
                Tipo: {spot.type === "COVERED" ? "Cubierto" : "Descubierto"}<br />
                Estado: {spot.available ? "Disponible" : "No disponible"}<br />
                {spot.price && `Precio: $${spot.price}/hora`}
              </div>
            </Popup>
          </Marker>
        );
          })}
      </MapContainer>
    </div>
  );
}
