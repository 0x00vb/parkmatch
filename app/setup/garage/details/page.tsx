"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HomeIcon, ShieldCheckIcon, KeyIcon, WifiIcon } from "@heroicons/react/24/outline";
import ProgressBar from "@/components/ui/ProgressBar";
import { useSession } from "next-auth/react";

const garageDetailsSchema = z.object({
  type: z.enum(["COVERED", "UNCOVERED"]),
  height: z.number().min(1.5, "La altura mínima es 1.5m").max(5, "La altura máxima es 5m"),
  width: z.number().min(1.5, "El ancho mínimo es 1.5m").max(5, "El ancho máximo es 5m"),
  length: z.number().min(3, "El largo mínimo es 3m").max(10, "El largo máximo es 10m"),
  hasGate: z.boolean(),
  hasCameras: z.boolean(),
  accessType: z.enum(["REMOTE_CONTROL", "KEYS"]),
  rules: z.string().optional(),
});

type GarageDetailsForm = z.infer<typeof garageDetailsSchema>;

export default function GarageDetailsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<GarageDetailsForm>({
    resolver: zodResolver(garageDetailsSchema),
    defaultValues: {
      type: "UNCOVERED",
      height: 2.0,
      width: 2.5,
      length: 5.0,
      hasGate: false,
      hasCameras: false,
      accessType: "REMOTE_CONTROL",
      rules: "",
    },
  });

  const watchedType = watch("type");
  const watchedHasGate = watch("hasGate");
  const watchedHasCameras = watch("hasCameras");
  const watchedAccessType = watch("accessType");

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    // Check if we have location data from previous step
    const locationData = sessionStorage.getItem("garageLocation");
    if (!locationData) {
      router.push("/setup/garage");
    }

    // Get next step info
    const nextStepData = sessionStorage.getItem("garageNextStep");
    setNextStep(nextStepData);
  }, [router]);

  if (status === "loading") {
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

  const onSubmit = async (data: GarageDetailsForm) => {
    setIsLoading(true);
    try {
      // Store details data in sessionStorage for next step
      sessionStorage.setItem("garageDetails", JSON.stringify(data));
      router.push("/setup/garage/photos");
    } catch (error) {
      alert("Error al guardar los detalles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (nextStep === "vehicles") {
      // Skip garage setup and go to vehicles
      router.push("/setup/vehicles?from=garage");
    } else {
      // Skip garage setup and go to completion
      router.push("/setup/complete");
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
          <div className="text-center mb-6">
            <h1 className="text-lg font-medium text-gray-900 mb-4">Publicar un espacio</h1>
            <ProgressBar currentStep={1} totalSteps={4} className="mb-6" />
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Detalles del espacio
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                Altura y medidas
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
                Seguridad
              </label>
              <div className="grid grid-cols-2 gap-3">
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
                  <ShieldCheckIcon className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Cámaras</div>
                </button>
              </div>
            </div>

            {/* Access Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Acceso
              </label>
              <div className="grid grid-cols-2 gap-3">
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
                  <div className="text-sm font-medium">Llave</div>
                </button>
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

            {/* Action Buttons */}
            <div className="space-y-3 mt-8">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-500 text-white font-semibold py-4 px-6 rounded-2xl hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Guardando..." : "Siguiente"}
              </button>
              
              {/* Skip Button - only show if part of conductor y propietario flow */}
              {nextStep && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full border border-gray-300 text-gray-700 font-medium py-4 px-6 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  Omitir por ahora
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
