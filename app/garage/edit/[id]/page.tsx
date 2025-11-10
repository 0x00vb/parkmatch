"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import {
  ArrowLeftIcon,
  HomeIcon,
  ShieldCheckIcon,
  KeyIcon,
  WifiIcon,
  CameraIcon,
  CurrencyDollarIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { useNotificationActions } from "@/lib/hooks/useNotifications";

const garageEditSchema = z.object({
  address: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  type: z.enum(["COVERED", "UNCOVERED"]),
  height: z.number().min(1.5, "La altura mínima es 1.5m").max(5, "La altura máxima es 5m"),
  width: z.number().min(1.5, "El ancho mínimo es 1.5m").max(5, "El ancho máximo es 5m"),
  length: z.number().min(3, "El largo mínimo es 3m").max(10, "El largo máximo es 10m"),
  hasGate: z.boolean(),
  hasCameras: z.boolean(),
  accessType: z.enum(["REMOTE_CONTROL", "KEYS"]),
  rules: z.string().optional(),
  hourlyPrice: z.number().min(0, "El precio por hora debe ser mayor a 0").optional(),
  dailyPrice: z.number().min(0, "El precio por día debe ser mayor a 0").optional(),
  monthlyPrice: z.number().min(0, "El precio por mes debe ser mayor a 0").optional(),
});

type GarageEditForm = z.infer<typeof garageEditSchema>;

interface AvailabilitySchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

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
  availabilitySchedules?: AvailabilitySchedule[];
}

export default function GarageEditPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [garage, setGarage] = useState<Garage | null>(null);
  const [fetchingGarage, setFetchingGarage] = useState(true);
  
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { showSuccess, showError } = useNotificationActions();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<GarageEditForm>({
    resolver: zodResolver(garageEditSchema),
  });

  const watchedType = watch("type");
  const watchedHasGate = watch("hasGate");
  const watchedHasCameras = watch("hasCameras");
  const watchedAccessType = watch("accessType");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Verificar que el usuario tenga rol de propietario
  useEffect(() => {
    if (session?.user?.role === "CONDUCTOR") {
      router.push("/dashboard");
    }
  }, [session?.user?.role, router]);

  useEffect(() => {
    if (params.id && session?.user?.id) {
      fetchGarage();
    }
  }, [params.id, session?.user?.id]);

  const fetchGarage = async () => {
    try {
      setFetchingGarage(true);
      const response = await fetch(`/api/garages/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setGarage(data.garage);
        
        // Populate form with garage data
        reset({
          address: data.garage.address,
          city: data.garage.city,
          type: data.garage.type,
          height: data.garage.height,
          width: data.garage.width,
          length: data.garage.length,
          hasGate: data.garage.hasGate,
          hasCameras: data.garage.hasCameras,
          accessType: data.garage.accessType,
          rules: data.garage.rules || "",
          // TODO: Add pricing fields when implemented in backend
          hourlyPrice: 0,
          dailyPrice: 0,
          monthlyPrice: 0,
        });
      } else {
        showError("Error", "No se pudo cargar la información de la cochera");
        router.push("/dashboard?section=garages");
      }
    } catch (error) {
      showError("Error de conexión", "Verifica tu conexión a internet");
      router.push("/dashboard?section=garages");
    } finally {
      setFetchingGarage(false);
    }
  };

  const onSubmit = async (data: GarageEditForm) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/garages/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showSuccess("Cochera actualizada", "Los cambios se guardaron correctamente");
        router.push("/dashboard?section=garages");
      } else {
        const errorData = await response.json();
        showError("Error al actualizar", errorData.message || "No se pudieron guardar los cambios");
      }
    } catch (error) {
      showError("Error de conexión", "Verifica tu conexión a internet");
    } finally {
      setIsLoading(false);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[dayOfWeek];
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove seconds if present
  };

  if (status === "loading" || fetchingGarage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session || !garage) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-sm md:max-w-2xl lg:max-w-4xl bg-white min-h-screen md:min-h-0 md:my-8 md:rounded-2xl md:shadow-xl">
        <div className="px-6 md:px-8 lg:px-12 pt-8 md:pt-6 lg:pt-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push("/dashboard?section=garages")}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
            </button>
            <h1 className="text-lg font-medium text-gray-900">Editar Cochera</h1>
            <div className="w-7" /> {/* Spacer */}
          </div>

          {/* Garage Image */}
          {garage.images.length > 0 && (
            <div className="mb-6">
              <img
                src={garage.images[0]}
                alt="Cochera"
                className="w-full h-32 object-cover rounded-xl"
              />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Address and City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  {...register("address")}
                  type="text"
                  id="address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ej: Av. Corrientes 1234"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad
                </label>
                <input
                  {...register("city")}
                  type="text"
                  id="city"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ciudad"
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de espacio
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue("type", "UNCOVERED")}
                  className={`p-4 border-2 rounded-xl text-center transition-colors ${
                    watchedType === "UNCOVERED"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-sm font-medium">Descubierto</div>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("type", "COVERED")}
                  className={`p-4 border-2 rounded-xl text-center transition-colors ${
                    watchedType === "COVERED"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-sm font-medium">Techado</div>
                </button>
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Dimensiones
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Altura</label>
                  <div className="relative">
                    <input
                      {...register("height", { valueAsNumber: true })}
                      type="number"
                      step="0.1"
                      min="1.5"
                      max="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">m</span>
                  </div>
                  {errors.height && (
                    <p className="text-red-500 text-xs mt-1">{errors.height.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ancho</label>
                  <div className="relative">
                    <input
                      {...register("width", { valueAsNumber: true })}
                      type="number"
                      step="0.1"
                      min="1.5"
                      max="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">m</span>
                  </div>
                  {errors.width && (
                    <p className="text-red-500 text-xs mt-1">{errors.width.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Largo</label>
                  <div className="relative">
                    <input
                      {...register("length", { valueAsNumber: true })}
                      type="number"
                      step="0.1"
                      min="3"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">m</span>
                  </div>
                  {errors.length && (
                    <p className="text-red-500 text-xs mt-1">{errors.length.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Security Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Características
              </label>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <button
                  type="button"
                  onClick={() => setValue("hasGate", !watchedHasGate)}
                  className={`p-4 border-2 rounded-xl text-center transition-colors ${
                    watchedHasGate
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <HomeIcon className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Portón</div>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("hasCameras", !watchedHasCameras)}
                  className={`p-4 border-2 rounded-xl text-center transition-colors ${
                    watchedHasCameras
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <CameraIcon className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Cámaras</div>
                </button>
              </div>
            </div>

            {/* Access Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de acceso
              </label>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <button
                  type="button"
                  onClick={() => setValue("accessType", "REMOTE_CONTROL")}
                  className={`p-4 border-2 rounded-xl text-center transition-colors ${
                    watchedAccessType === "REMOTE_CONTROL"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <WifiIcon className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Control</div>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("accessType", "KEYS")}
                  className={`p-4 border-2 rounded-xl text-center transition-colors ${
                    watchedAccessType === "KEYS"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <KeyIcon className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Llaves</div>
                </button>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <CurrencyDollarIcon className="w-5 h-5 inline mr-2" />
                Precios (ARS)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Precio por hora</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                    <input
                      {...register("hourlyPrice", { valueAsNumber: true })}
                      type="number"
                      min="0"
                      step="10"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  {errors.hourlyPrice && (
                    <p className="text-red-500 text-xs mt-1">{errors.hourlyPrice.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Precio por día</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                    <input
                      {...register("dailyPrice", { valueAsNumber: true })}
                      type="number"
                      min="0"
                      step="50"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  {errors.dailyPrice && (
                    <p className="text-red-500 text-xs mt-1">{errors.dailyPrice.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Precio por mes</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                    <input
                      {...register("monthlyPrice", { valueAsNumber: true })}
                      type="number"
                      min="0"
                      step="1000"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  {errors.monthlyPrice && (
                    <p className="text-red-500 text-xs mt-1">{errors.monthlyPrice.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Rules */}
            <div>
              <label htmlFor="rules" className="block text-sm font-medium text-gray-700 mb-2">
                Reglas específicas
              </label>
              <textarea
                {...register("rules")}
                id="rules"
                rows={3}
                placeholder="Ej: No apto para vehículos con GNC, No estacionar motos."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Availability Schedules */}
            {garage.availabilitySchedules && garage.availabilitySchedules.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <ClockIcon className="w-5 h-5 text-gray-600" />
                  <h3 className="text-sm font-medium text-gray-900">Horarios disponibles</h3>
                </div>
                <div className="space-y-2">
                  {garage.availabilitySchedules
                    .filter(schedule => schedule.isActive)
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">
                          {getDayName(schedule.dayOfWeek)}
                        </span>
                        <span className="text-gray-600">
                          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                        </span>
                      </div>
                    ))}
                </div>
                {garage.availabilitySchedules.filter(schedule => schedule.isActive).length === 0 && (
                  <p className="text-sm text-gray-500">No hay horarios configurados</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 pb-0 md:pb-8">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-500 text-white font-semibold py-4 px-6 rounded-2xl hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Guardando cambios..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
