"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, TruckIcon, CalendarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useNotificationActions } from "@/lib/hooks/useNotifications";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year?: number;
  licensePlate: string;
  height?: number;
  width?: number;
  length?: number;
  createdAt: string;
}

export default function VehiclesSection() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { showError } = useNotificationActions();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/vehicles");

      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || []);
      } else {
        showError("Error al cargar vehículos", "Inténtalo de nuevo más tarde");
      }
    } catch (error) {
      showError("Error de conexión", "Verifica tu conexión a internet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVehicle = () => {
    router.push("/setup/vehicles/add");
  };

  const formatDimensions = (vehicle: Vehicle) => {
    const dimensions = [];
    if (vehicle.length) dimensions.push(`L: ${vehicle.length.toFixed(1)}m`);
    if (vehicle.width) dimensions.push(`A: ${vehicle.width.toFixed(1)}m`);
    if (vehicle.height) dimensions.push(`Al: ${vehicle.height.toFixed(1)}m`);
    return dimensions.join(" • ");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="bg-white p-4 shadow-sm shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <h1 className="text-xl font-bold text-gray-900 text-center flex-1">
              Vehículos
            </h1>
            <div className="flex-1" />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando vehículos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <h1 className="text-xl font-bold text-gray-900 text-center flex-1">
            Vehículos
          </h1>
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleAddVehicle}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-600 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Agregar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 pb-20 overflow-y-auto">
        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <TruckIcon className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes vehículos registrados
            </h3>
            <p className="text-gray-600 mb-6 max-w-sm">
              Agrega tu primer vehículo para poder reservar cocheras que se ajusten a sus dimensiones.
            </p>
            <button
              onClick={handleAddVehicle}
              className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Agregar primer vehículo
            </button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <TruckIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {vehicle.year && `${vehicle.year} • `}{vehicle.licensePlate}
                      </p>
                    </div>
                  </div>
                </div>

                {formatDimensions(vehicle) && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-600 mb-1">Dimensiones:</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDimensions(vehicle)}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      Agregado {new Date(vehicle.createdAt).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    <span>Listo para reservar</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
