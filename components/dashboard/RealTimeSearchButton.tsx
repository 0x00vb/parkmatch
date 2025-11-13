"use client";

import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon as MagnifyingGlassIconSolid } from "@heroicons/react/24/solid";

interface RealTimeSearchButtonProps {
  onSearch: () => void;
  isSearching: boolean;
  disabled?: boolean;
  hasGarages?: boolean;
}

export default function RealTimeSearchButton({
  onSearch,
  isSearching,
  disabled = false,
  hasGarages = true
}: RealTimeSearchButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (!disabled && !isSearching) {
      onSearch();
    }
  };

  const handlePressStart = () => {
    setIsPressed(true);
  };

  const handlePressEnd = () => {
    setIsPressed(false);
  };

  return (
    <button
      onClick={handleClick}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      disabled={disabled || isSearching || !hasGarages}
      className={`
        relative w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg transition-all duration-200 ease-out
        flex items-center justify-center group
        ${disabled || isSearching || !hasGarages
          ? 'bg-gray-400 cursor-not-allowed'
          : isPressed
            ? 'bg-green-700 scale-95'
            : 'bg-green-600 hover:bg-green-700 active:scale-95'
        }
        ${isSearching ? 'animate-pulse' : ''}
      `}
      aria-label="Buscar cocheras cercanas en tiempo real"
    >
      <MagnifyingGlassIcon className="w-6 h-6 text-white" />

      {/* Ripple effect */}
      {isPressed && !disabled && !isSearching && (
        <div className="absolute inset-0 rounded-full bg-green-500 opacity-30 animate-ping" />
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
        Buscar en tiempo real
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
      </div>
    </button>
  );
}
