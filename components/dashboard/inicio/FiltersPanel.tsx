"use client";

interface FiltersPanelProps {
  showFilters: boolean;
  onCloseFilters: () => void;
}

export default function FiltersPanel({ showFilters, onCloseFilters }: FiltersPanelProps) {
  if (!showFilters) {
    return null;
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4 md:p-6 lg:p-8">
      <div className="max-w-full md:max-w-2xl lg:max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de cochera
            </label>
            <select className="w-full p-2 md:p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500">
              <option value="">Cualquiera</option>
              <option value="COVERED">Cubierta</option>
              <option value="UNCOVERED">Descubierta</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio máximo
            </label>
            <input
              type="number"
              placeholder="$500"
              className="w-full p-2 md:p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-4 md:mt-6">
          <button className="flex-1 py-2 md:py-3 px-4 md:px-6 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors">
            Aplicar filtros
          </button>
          <button
            onClick={onCloseFilters}
            className="flex-1 py-2 md:py-3 px-4 md:px-6 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
