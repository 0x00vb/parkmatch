"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  PlusIcon, 
  BuildingOfficeIcon, 
  CalendarIcon, 
  MapPinIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  CameraIcon,
  ShieldCheckIcon,
  PencilIcon,
  ClockIcon,
  CurrencyDollarIcon,
  StarIcon
} from "@heroicons/react/24/outline";
import { useNotificationActions } from "@/lib/hooks/useNotifications";

interface Garage {
  id: string;
  address: string;
  city: string;
  type: "COVERED" | "UNCOVERED";
  height: number;
  width: number;
  length: number;
  hasGate: boolean;
  hasCameras: boolean;
  accessType: "REMOTE_CONTROL" | "KEYS";
  rules?: string;
  images: string[];
  isActive: boolean;
  createdAt: string;
}

export default function GaragesSection() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const { showSuccess, showError } = useNotificationActions();

  useEffect(() => {
    fetchGarages();
  }, []);

  const fetchGarages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/garages");

      if (response.ok) {
        const data = await response.json();
        setGarages(data.garages || []);
      } else {
        showError("Error al cargar cocheras", "Inténtalo de nuevo más tarde");
      }
    } catch (error) {
      showError("Error de conexión", "Verifica tu conexión a internet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGarage = () => {
    // Set a flag to indicate we're coming from dashboard
    sessionStorage.setItem("garageSource", "dashboard");
    router.push("/setup/garage");
  };

  const handleDeleteGarage = async (garageId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta cochera?")) {
      return;
    }

    try {
      setDeletingId(garageId);
      const response = await fetch(`/api/garages/${garageId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setGarages(prev => prev.filter(garage => garage.id !== garageId));
        showSuccess("Cochera eliminada", "La cochera se eliminó correctamente");
      } else {
        const data = await response.json();
        showError("Error al eliminar", data.message || "No se pudo eliminar la cochera");
      }
    } catch (error) {
      showError("Error de conexión", "Verifica tu conexión a internet");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleGarageStatus = async (garageId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/garages/${garageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        // Update local state
        setGarages(prev => prev.map(garage => 
          garage.id === garageId 
            ? { ...garage, isActive: !currentStatus }
            : garage
        ));
        
        showSuccess(
          !currentStatus ? "Cochera activada" : "Cochera desactivada", 
          !currentStatus ? "Tu cochera ahora es visible para los usuarios" : "Tu cochera está oculta para los usuarios"
        );
      } else {
        const data = await response.json();
        showError("Error al actualizar", data.message || "No se pudo cambiar el estado de la cochera");
      }
    } catch (error) {
      showError("Error de conexión", "Verifica tu conexión a internet");
    }
  };

  const handleEditGarage = (garageId: string) => {
    router.push(`/garage/edit/${garageId}`);
  };

  const formatDimensions = (garage: Garage) => {
    return `${garage.length.toFixed(1)}m × ${garage.width.toFixed(1)}m × ${garage.height.toFixed(1)}m`;
  };

  const getTypeLabel = (type: string) => {
    return type === "COVERED" ? "Cubierta" : "Descubierta";
  };

  const getAccessTypeLabel = (accessType: string) => {
    return accessType === "REMOTE_CONTROL" ? "Control remoto" : "Llaves";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-white p-4 shadow-sm shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <h1 className="text-xl font-bold text-gray-900 text-center flex-1">
              Mis Garages
            </h1>
            <div className="flex-1" />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando cocheras...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <h1 className="text-xl font-bold text-gray-900 text-center flex-1">
            Mis Garages
          </h1>
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleAddGarage}
              className="flex items-center gap-2 bg-green-500 text-white p-2 rounded-full font-medium hover:bg-green-600 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-50 p-4 overflow-y-auto ">
        {garages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BuildingOfficeIcon className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes cocheras registradas
            </h3>
            <p className="text-gray-600 mb-6 max-w-sm">
              Agrega tu primera cochera para comenzar a generar ingresos alquilándola a otros conductores.
            </p>
            <button
              onClick={handleAddGarage}
              className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Agregar primera cochera
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {garages.map((garage) => (
              <div
                key={garage.id}
                className=" bg-white rounded-xl overflow-hidden shadow-sm border w-full border-gray-100"
              >
                {/* Garage Image */}
                <div className="relative">
                  {garage.images.length > 0 ? (
                    <img
                      src={garage.images[0]}
                      alt="Cochera"
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-38 bg-gray-200 flex items-center justify-center">
                      <BuildingOfficeIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      garage.isActive 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-500 text-white"
                    }`}>
                      {garage.isActive ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => handleDeleteGarage(garage.id)}
                      disabled={deletingId === garage.id}
                      className="p-2 rounded-full bg-white/90 text-red-600 hover:bg-white transition-colors disabled:opacity-50"
                      title="Eliminar cochera"
                    >
                      {deletingId === garage.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Address and Rating */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 text-base mb-1">
                      {garage.address.split(',')[0]}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {getTypeLabel(garage.type)}
                    </p>
                
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleEditGarage(garage.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">Editar Detalles</span>
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        garage.isActive ? "text-green-600" : "text-gray-500"
                      }`}>
                        {garage.isActive ? "Visible" : "Oculta"}
                      </span>
                      <button
                        onClick={() => toggleGarageStatus(garage.id, garage.isActive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          garage.isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            garage.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Features and Info */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span>{formatDimensions(garage)}</span>
                        </div>
                        {garage.hasGate && (
                          <div className="flex items-center gap-1">
                            <span>Portón</span>
                          </div>
                        )}
                        {garage.hasCameras && (
                          <div className="flex items-center gap-1">
                            <CameraIcon className="h-3 w-3" />
                            <span>Cámaras</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span>
                          {new Date(garage.createdAt).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    </div>
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
