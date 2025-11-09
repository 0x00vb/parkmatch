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
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de cochera
          </label>
          <select className="w-full p-2 border border-gray-300 rounded-md">
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
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md font-medium">
          Aplicar filtros
        </button>
        <button
          onClick={onCloseFilters}
          className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-md font-medium"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
