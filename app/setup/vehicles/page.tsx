"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import ProgressBar from "@/components/ui/ProgressBar";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year?: number;
  licensePlate: string;
  height?: number;
  width?: number;
  length?: number;
}

interface SearchPreferences {
  minHeight: number;
  coveredOnly: boolean;
}

export default function VehicleManagementPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [preferences, setPreferences] = useState<SearchPreferences>({
    minHeight: 2.0,
    coveredOnly: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch("/api/vehicles");
      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || []);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm("¿Estás seguro de que querés eliminar este vehículo?")) return;

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setVehicles(vehicles.filter(v => v.id !== vehicleId));
      } else {
        alert("Error al eliminar el vehículo");
      }
    } catch (error) {
      alert("Error al eliminar el vehículo");
    }
  };

  const handleContinue = async () => {
    // Save preferences
    try {
      await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      router.push("/setup/complete");
    } catch (error) {
      alert("Error al guardar las preferencias");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-sm bg-white min-h-screen">
        <div className="px-6 pt-8">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-lg font-medium text-gray-900 mb-4">Gestioná tus Vehículos</h1>
            <p className="text-sm text-gray-600">
              Añadí los vehículos que usarás para estacionar. Esto nos ayudará a encontrar el lugar perfecto para ti.
            </p>
          </div>

          {/* Vehicle Illustration */}
          <div className="flex justify-center mb-8">
            <div className="w-32 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-16 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
          </div>

          {/* No Vehicles State */}
          {vehicles.length === 0 ? (
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No tienes vehículos añadidos
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Añadí tu primer vehículo para encontrar fácilmente estacionamiento ideal.
              </p>
              <button
                onClick={() => router.push("/setup/vehicles/add")}
                className="w-full bg-green-500 text-white font-semibold py-4 px-6 rounded-2xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Añadir vehículo
              </button>
            </div>
          ) : (
            <>
              {/* Vehicle List */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mis Vehículos</h3>
                <div className="space-y-3">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {vehicle.brand} {vehicle.model}
                            </p>
                            <p className="text-sm text-gray-600">
                              Patente: {vehicle.licensePlate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/setup/vehicles/edit/${vehicle.id}`)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                            className="p-2 text-red-400 hover:text-red-600"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => router.push("/setup/vehicles/add")}
                  className="w-full mt-4 border-2 border-dashed border-gray-300 rounded-xl py-4 text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  Añadir otro vehículo
                </button>
              </div>
            </>
          )}

          {/* Search Preferences */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferencias de Búsqueda</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Altura mínima requerida
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1.5"
                    max="3.0"
                    step="0.1"
                    value={preferences.minHeight}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      minHeight: parseFloat(e.target.value)
                    })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-sm font-medium text-gray-900 min-w-[3rem]">
                    {preferences.minHeight.toFixed(1)}m
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Solo cocheras cubiertas</p>
                  <p className="text-sm text-gray-600">
                    Mostrar únicamente espacios techados
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.coveredOnly}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      coveredOnly: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className="w-full bg-green-500 text-white font-semibold py-4 px-6 rounded-2xl hover:bg-green-600 transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
