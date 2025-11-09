"use client";

import { MapPinIcon } from "@heroicons/react/24/outline";

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

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  isSearching: boolean;
  searchQuery: string;
  onSelectSuggestion: (suggestion: SearchSuggestion) => void;
  onClose: () => void;
}

export default function SearchSuggestions({
  suggestions,
  isSearching,
  searchQuery,
  onSelectSuggestion,
  onClose
}: SearchSuggestionsProps) {
  if (!suggestions.length && !isSearching && searchQuery.length >= 3) {
    return (
      <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 mt-1">
        <div className="text-sm text-gray-500 text-center">
          No se encontraron ubicaciones para &quot;{searchQuery}&quot;
        </div>
      </div>
    );
  }

  if (!suggestions.length) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => {
            onSelectSuggestion(suggestion);
            onClose();
          }}
          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
        >
          <div className="flex items-start gap-3">
            <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 truncate">
                {suggestion.result.displayName}
              </div>
              {suggestion.result.address.city && (
                <div className="text-xs text-gray-500 truncate">
                  {suggestion.result.address.city}
                  {suggestion.result.address.state && `, ${suggestion.result.address.state}`}
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
