"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LatLngExpression } from "leaflet";
import { configureLeaflet, createParkingIcon, createGarageIcon } from "@/lib/leaflet-config";

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

interface MapProps {
  center: { lat: number; lng: number };
  zoom: number;
  parkingSpots: ParkingSpot[];
  garages: Garage[];
  onMapReady?: () => void;
  onGarageClick?: (garageId: string) => void;
}

export default function Map({ center, zoom, parkingSpots, garages, onMapReady, onGarageClick }: MapProps) {
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

      {/* Garage Markers */}
      {garages.map((garage) => {
        const garageIcon = createGarageIcon(garage.type);

        if (!garageIcon) return null;

        const ownerName = garage.user.firstName && garage.user.lastName
          ? `${garage.user.firstName} ${garage.user.lastName}`
          : garage.user.name || "Propietario";

        return (
          <Marker
            key={`garage-${garage.id}`}
            position={[garage.latitude, garage.longitude] as LatLngExpression}
            icon={garageIcon}
            eventHandlers={{
              click: () => {
                if (onGarageClick) {
                  onGarageClick(garage.id);
                }
              }
            }}
          >
            <Popup>
              <div className="text-sm max-w-48">
                <strong className="text-blue-600">{garage.address}</strong><br />
                <span className="text-gray-600">{garage.city}</span><br />
                <span className="text-xs text-gray-500">Tipo: {garage.type === "COVERED" ? "Cubierta" : "Descubierta"}</span><br />
                <span className="text-xs text-gray-500">Propietario: {ownerName}</span><br />
                {garage.hourlyPrice && (
                  <span className="text-xs text-green-600 font-medium">
                    Hora: ${garage.hourlyPrice}
                  </span>
                )}
                {garage.dailyPrice && garage.hourlyPrice && <span className="text-xs text-gray-400"> • </span>}
                {garage.dailyPrice && (
                  <span className="text-xs text-green-600 font-medium">
                    Día: ${garage.dailyPrice}
                  </span>
                )}
                {garage.monthlyPrice && (garage.hourlyPrice || garage.dailyPrice) && <span className="text-xs text-gray-400"> • </span>}
                {garage.monthlyPrice && (
                  <span className="text-xs text-green-600 font-medium">
                    Mes: ${garage.monthlyPrice}
                  </span>
                )}
                <div className="mt-1 flex flex-wrap gap-1">
                  {garage.hasGate && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                      Portón
                    </span>
                  )}
                  {garage.hasCameras && (
                    <span className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded">
                      Cámaras
                    </span>
                  )}
                  <span className="text-xs bg-gray-100 text-gray-800 px-1 py-0.5 rounded">
                    {garage.accessType === "REMOTE_CONTROL" ? "Control remoto" : "Llaves"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Dimensiones: {garage.length}m x {garage.width}m x {garage.height}m
                </div>
                <button 
                  onClick={() => onGarageClick && onGarageClick(garage.id)}
                  className="mt-2 w-full bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                >
                  Ver detalles
                </button>
              </div>
            </Popup>
          </Marker>
        );
          })}
      </MapContainer>
    </div>
  );
}
