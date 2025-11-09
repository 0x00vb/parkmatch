"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";

const vehicleSchema = z.object({
  makeId: z.number().min(1, "La marca es requerida"),
  modelId: z.number().min(1, "El modelo es requerido"),
  year: z.number().min(1990).max(new Date().getFullYear() + 1).optional(),
  licensePlate: z.string().min(6, "La patente debe tener al menos 6 caracteres"),
});

type VehicleForm = z.infer<typeof vehicleSchema>;

interface Make {
  id: number;
  name: string;
}

interface Model {
  id: number;
  name: string;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
}

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

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;
  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(true);
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
  });

  const watchedMakeId = watch("makeId");

  // Check if user is coming from dashboard (already registered user)
  const isFromDashboard = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('from') === 'dashboard';

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Load makes on component mount
  useEffect(() => {
    const loadMakes = async () => {
      try {
        const response = await fetch("/api/makes");
        if (response.ok) {
          const data = await response.json();
          setMakes(data.makes);
        }
      } catch (error) {
        console.error("Error loading makes:", error);
      }
    };
    loadMakes();
  }, []);

  // Load models when make changes
  useEffect(() => {
    const loadModels = async () => {
      if (!watchedMakeId) {
        setModels([]);
        setSelectedModel(null);
        setValue("modelId", 0);
        return;
      }

      try {
        const response = await fetch(`/api/models?make_id=${watchedMakeId}`);
        if (response.ok) {
          const data = await response.json();
          setModels(data.models);
        }
      } catch (error) {
        console.error("Error loading models:", error);
        setModels([]);
      }
    };
    loadModels();
  }, [watchedMakeId, setValue]);

  // Load vehicle data
  useEffect(() => {
    const loadVehicle = async () => {
      if (!vehicleId) return;

      try {
        const response = await fetch(`/api/vehicles/${vehicleId}`);
        if (response.ok) {
          const data = await response.json();
          const vehicleData = data.vehicle;
          setVehicle(vehicleData);

          // Find make and set values
          const make = makes.find(m => m.name === vehicleData.brand);
          if (make) {
            setValue("makeId", make.id);

            // Load models for this make
            const modelsResponse = await fetch(`/api/models?make_id=${make.id}`);
            if (modelsResponse.ok) {
              const modelsData = await modelsResponse.json();
              setModels(modelsData.models);

              // Find model and set values
              const model = modelsData.models.find((m: Model) => m.name === vehicleData.model);
              if (model) {
                setValue("modelId", model.id);
                setSelectedModel(model);
              }
            }
          }

          setValue("year", vehicleData.year);
          setValue("licensePlate", vehicleData.licensePlate);
        }
      } catch (error) {
        console.error("Error loading vehicle:", error);
      } finally {
        setIsLoadingVehicle(false);
      }
    };

    if (makes.length > 0 && vehicleId) {
      loadVehicle();
    }
  }, [vehicleId, makes, setValue]);

  // Early returns must happen after all hooks are called
  if (status === "loading" || isLoadingVehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Vehículo no encontrado</p>
        </div>
      </div>
    );
  }

  const handleModelChange = (modelId: number) => {
    const model = models.find(m => m.id === modelId);
    setSelectedModel(model || null);
  };

  const onSubmit = async (data: VehicleForm) => {
    setIsLoading(true);
    try {
      // Find make and model names
      const selectedMake = makes.find(make => make.id === data.makeId);
      const selectedModel = models.find(model => model.id === data.modelId);

      if (!selectedMake || !selectedModel) {
        alert("Error: Marca o modelo no encontrado");
        return;
      }

      const vehicleData = {
        brand: selectedMake.name,
        model: selectedModel.name,
        year: data.year,
        licensePlate: data.licensePlate,
        // Use dimensions from the models table if available
        height: selectedModel.height_mm ? selectedModel.height_mm / 1000 : undefined, // Convert mm to meters
        width: selectedModel.width_mm ? selectedModel.width_mm / 1000 : undefined,
        length: selectedModel.length_mm ? selectedModel.length_mm / 1000 : undefined,
      };

      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleData),
      });

      if (response.ok) {
        // If coming from dashboard, redirect back to dashboard
        // Otherwise, continue with setup flow
        if (isFromDashboard) {
          router.push("/dashboard");
        } else {
          router.push("/setup/vehicles");
        }
      } else {
        alert("Error al actualizar el vehículo");
      }
    } catch (error) {
      alert("Error al actualizar el vehículo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-sm bg-white min-h-screen">
        <div className="px-6 pt-8">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => isFromDashboard ? router.push("/dashboard") : router.back()}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Editar Vehículo
            </h1>
            <p className="text-gray-600 text-sm">
              Actualizá los datos de tu vehículo.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="makeId" className="block text-sm font-medium text-gray-700 mb-2">
                Marca
              </label>
              <select
                {...register("makeId", { valueAsNumber: true })}
                id="makeId"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Seleccionar marca</option>
                {makes.map((make) => (
                  <option key={make.id} value={make.id}>
                    {make.name}
                  </option>
                ))}
              </select>
              {errors.makeId && (
                <p className="text-red-500 text-sm mt-1">{errors.makeId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="modelId" className="block text-sm font-medium text-gray-700 mb-2">
                Modelo
              </label>
              <select
                {...register("modelId", { valueAsNumber: true })}
                id="modelId"
                disabled={!watchedMakeId || models.length === 0}
                onChange={(e) => handleModelChange(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {watchedMakeId ? (models.length === 0 ? "Cargando modelos..." : "Seleccionar modelo") : "Primero selecciona una marca"}
                </option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              {errors.modelId && (
                <p className="text-red-500 text-sm mt-1">{errors.modelId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Año (opcional)
              </label>
              <input
                {...register("year", { valueAsNumber: true })}
                type="number"
                id="year"
                placeholder="Ej: 2020"
                min="1990"
                max={new Date().getFullYear() + 1}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {errors.year && (
                <p className="text-red-500 text-sm mt-1">{errors.year.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-2">
                Patente
              </label>
              <input
                {...register("licensePlate")}
                type="text"
                id="licensePlate"
                placeholder="Ej: AB123CD"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                style={{ textTransform: "uppercase" }}
              />
              {errors.licensePlate && (
                <p className="text-red-500 text-sm mt-1">{errors.licensePlate.message}</p>
              )}
            </div>

            {/* Selected Model Info */}
            {selectedModel && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-medium text-green-900 mb-2">Información del modelo:</h3>
                <div className="text-sm text-green-800 space-y-1">
                  {selectedModel.length_mm && (
                    <p><strong>Largo:</strong> {(selectedModel.length_mm / 1000).toFixed(2)} m</p>
                  )}
                  {selectedModel.width_mm && (
                    <p><strong>Ancho:</strong> {(selectedModel.width_mm / 1000).toFixed(2)} m</p>
                  )}
                  {selectedModel.height_mm && (
                    <p><strong>Alto:</strong> {(selectedModel.height_mm / 1000).toFixed(2)} m</p>
                  )}
                  <p className="text-xs text-green-600 mt-2">
                    Las dimensiones se obtienen de la base de datos del modelo seleccionado.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 text-white font-semibold py-4 px-6 rounded-2xl hover:bg-green-600 transition-colors disabled:opacity-50 mt-8"
            >
              {isLoading ? "Actualizando vehículo..." : "Actualizar vehículo"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
