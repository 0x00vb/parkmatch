"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

interface MapControllerProps {
  zoom: number;
  center: { lat: number; lng: number };
}

export default function MapController({ zoom, center }: MapControllerProps) {
  const map = useMap();
  const previousCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!map) return;
    // Apply view update when center or zoom changes
    const hasCenterChanged =
      !previousCenterRef.current ||
      Math.abs(previousCenterRef.current.lat - center.lat) > 0.000001 ||
      Math.abs(previousCenterRef.current.lng - center.lng) > 0.000001;
    const hasZoomChanged = map.getZoom() !== zoom;

    if (hasCenterChanged || hasZoomChanged) {
      map.setView([center.lat, center.lng], zoom);
      previousCenterRef.current = center;
      // Invalidate size to ensure proper rendering
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [center, zoom, map]);


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
