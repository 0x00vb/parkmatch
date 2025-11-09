"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface MapControllerProps {
  zoom: number;
  center: { lat: number; lng: number };
  onMapReady?: () => void;
}

export default function MapController({ zoom, center, onMapReady }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      map.setZoom(zoom);
    }
  }, [zoom, map]);

  useEffect(() => {
    if (map && center.lat && center.lng) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom, map]);

  useEffect(() => {
    // Notify when map is ready
    if (onMapReady && map) {
      map.whenReady(onMapReady);
    }
  }, [map, onMapReady]);

  // Force map to invalidate size after mount
  useEffect(() => {
    if (map) {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [map]);

  return null;
}
