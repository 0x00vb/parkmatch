"use client";

import { useCallback } from "react";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import DebouncedInput from "@/components/ui/DebouncedInput";
import SearchSuggestions from "./SearchSuggestions";

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  address: {
    houseNumber?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface SearchSuggestion {
  result: GeocodingResult;
  distance?: number;
}

interface SearchHeaderProps {
  searchQuery: string;
  debouncedSearchQuery: string;
  showSuggestions: boolean;
  searchSuggestions: SearchSuggestion[];
  isSearching: boolean;
  selectedLocation: GeocodingResult | null;
  showFilters: boolean;
  onSearchChange: (value: string) => void;
  onDebouncedSearchChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSelectSuggestion: (suggestion: SearchSuggestion) => void;
  onCloseSuggestions: () => void;
  onToggleFilters: () => void;
}

export default function SearchHeader({
  searchQuery,
  debouncedSearchQuery,
  showSuggestions,
  searchSuggestions,
  isSearching,
  selectedLocation,
  showFilters,
  onSearchChange,
  onDebouncedSearchChange,
  onKeyDown,
  onSelectSuggestion,
  onCloseSuggestions,
  onToggleFilters
}: SearchHeaderProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    onKeyDown(e);
  }, [onKeyDown]);

  return (
    <div className="bg-white p-4 shadow-sm shrink-0">
      <div className="mb-4 relative">
        <DebouncedInput
          value={searchQuery}
          onChange={onSearchChange}
          onDebouncedChange={onDebouncedSearchChange}
          onKeyDown={handleKeyDown}
          placeholder="Buscar dirección, barrio o punto de interés"
          debounceMs={300}
          maxLength={200}
          aria-label="Buscar ubicación"
          showClearButton={!!selectedLocation}
        />

        {/* Sugerencias de búsqueda */}
        {showSuggestions && (
          <SearchSuggestions
            suggestions={searchSuggestions}
            isSearching={isSearching}
            searchQuery={debouncedSearchQuery}
            onSelectSuggestion={onSelectSuggestion}
            onClose={onCloseSuggestions}
          />
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={onToggleFilters}
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
  );
}
