"use client";

import { PlusIcon, MinusIcon, MapPinIcon } from "@heroicons/react/24/outline";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocationClick: () => void;
}

export default function MapControls({ onZoomIn, onZoomOut, onLocationClick }: MapControlsProps) {
  return (
    <>
      {/* Map Controls */}
      <div className="absolute right-4 top-4 flex flex-col gap-2 z-10">
        <button
          onClick={onZoomIn}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
        >
          <PlusIcon className="h-5 w-5 text-gray-600" />
        </button>
        <button
          onClick={onZoomOut}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
        >
          <MinusIcon className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Location Button */}
      <button
        onClick={onLocationClick}
        className="absolute right-4 bottom-4 w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 z-10"
      >
        <MapPinIcon className="h-6 w-6 text-gray-600" />
      </button>
    </>
  );
}
