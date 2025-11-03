"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const vehicleSchema = z.object({
  brand: z.string().min(1, "La marca es requerida"),
  model: z.string().min(1, "El modelo es requerido"),
  year: z.number().min(1990).max(new Date().getFullYear() + 1).optional(),
  licensePlate: z.string().min(6, "La patente debe tener al menos 6 caracteres"),
});

type VehicleForm = z.infer<typeof vehicleSchema>;

interface CarData {
  make: string;
  model: string;
  year: number;
  class: string;
  fuel_type: string;
  transmission: string;
  drive: string;
  city_mpg: number;
  highway_mpg: number;
  combination_mpg: number;
}

export default function AddVehiclePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [carSuggestions, setCarSuggestions] = useState<CarData[]>([]);
  const [selectedCar, setSelectedCar] = useState<CarData | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
  });

  const watchedBrand = watch("brand");
  const watchedModel = watch("model");

  const searchCarData = async () => {
    if (!watchedBrand || !watchedModel) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/cars/search?make=${encodeURIComponent(watchedBrand)}&model=${encodeURIComponent(watchedModel)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setCarSuggestions(data.cars || []);
      }
    } catch (error) {
      console.error("Error searching car data:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectCarSuggestion = (car: CarData) => {
    setSelectedCar(car);
    setValue("brand", car.make);
    setValue("model", car.model);
    setValue("year", car.year);
    setCarSuggestions([]);
  };

  const onSubmit = async (data: VehicleForm) => {
    setIsLoading(true);
    try {
      const vehicleData = {
        ...data,
        // Add estimated dimensions based on car class if available
        height: selectedCar?.class === "compact car" ? 1.5 : 
                selectedCar?.class === "midsize car" ? 1.6 :
                selectedCar?.class === "large car" ? 1.7 : undefined,
        width: 1.8, // Standard car width
        length: selectedCar?.class === "compact car" ? 4.2 : 
                selectedCar?.class === "midsize car" ? 4.6 :
                selectedCar?.class === "large car" ? 5.0 : 4.5,
      };

      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleData),
      });

      if (response.ok) {
        router.push("/setup/vehicles");
      } else {
        alert("Error al añadir el vehículo");
      }
    } catch (error) {
      alert("Error al añadir el vehículo");
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
              onClick={() => router.back()}
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
              Añadir Vehículo
            </h1>
            <p className="text-gray-600 text-sm">
              Ingresá los datos de tu vehículo para encontrar el estacionamiento perfecto.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                Marca
              </label>
              <input
                {...register("brand")}
                type="text"
                id="brand"
                placeholder="Ej: Toyota"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {errors.brand && (
                <p className="text-red-500 text-sm mt-1">{errors.brand.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                Modelo
              </label>
              <div className="relative">
                <input
                  {...register("model")}
                  type="text"
                  id="model"
                  placeholder="Ej: Corolla"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
                />
                <button
                  type="button"
                  onClick={searchCarData}
                  disabled={!watchedBrand || !watchedModel || isSearching}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 disabled:opacity-50"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              </div>
              {errors.model && (
                <p className="text-red-500 text-sm mt-1">{errors.model.message}</p>
              )}
            </div>

            {/* Car Suggestions */}
            {carSuggestions.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-medium text-gray-900 mb-3">Sugerencias encontradas:</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {carSuggestions.slice(0, 5).map((car, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectCarSuggestion(car)}
                      className="w-full text-left p-3 bg-white rounded-lg hover:bg-green-50 border border-gray-200 hover:border-green-300 transition-colors"
                    >
                      <p className="font-medium text-gray-900">
                        {car.make} {car.model} {car.year}
                      </p>
                      <p className="text-sm text-gray-600">
                        {car.class} • {car.fuel_type}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

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

            {/* Selected Car Info */}
            {selectedCar && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-medium text-green-900 mb-2">Información del vehículo:</h3>
                <div className="text-sm text-green-800 space-y-1">
                  <p><strong>Tipo:</strong> {selectedCar.class}</p>
                  <p><strong>Combustible:</strong> {selectedCar.fuel_type}</p>
                  <p><strong>Transmisión:</strong> {selectedCar.transmission}</p>
                  <p className="text-xs text-green-600 mt-2">
                    Las dimensiones se estimarán automáticamente basadas en el tipo de vehículo.
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
              {isLoading ? "Añadiendo vehículo..." : "Añadir vehículo"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
