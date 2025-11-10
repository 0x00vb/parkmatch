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
      <div className="absolute right-4 md:right-6 lg:right-8 top-4 md:top-6 lg:top-8 flex flex-col gap-2 z-10">
        <button
          onClick={onZoomIn}
          className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <PlusIcon className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
        </button>
        <button
          onClick={onZoomOut}
          className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <MinusIcon className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
        </button>
      </div>

      {/* Location Button */}
      <button
        onClick={onLocationClick}
        className="absolute right-4 md:right-6 lg:right-8 bottom-4 md:bottom-6 lg:bottom-8 w-12 h-12 md:w-14 md:h-14 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
      >
        <MapPinIcon className="h-6 w-6 md:h-7 md:w-7 text-gray-600" />
      </button>
    </>
  );
}
