"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ClockIcon, CalendarDaysIcon, CalendarIcon } from "@heroicons/react/24/outline";
import ProgressBar from "@/components/ui/ProgressBar";
import { useSession } from "next-auth/react";

const garagePricingSchema = z.object({
  hourlyPrice: z.number().min(0, "El precio debe ser mayor a 0").max(10000, "Precio demasiado alto").optional(),
  dailyPrice: z.number().min(0, "El precio debe ser mayor a 0").max(50000, "Precio demasiado alto").optional(),
  monthlyPrice: z.number().min(0, "El precio debe ser mayor a 0").max(200000, "Precio demasiado alto").optional(),
}).refine((data) => {
  // Al menos uno de los precios debe estar definido
  return data.hourlyPrice || data.dailyPrice || data.monthlyPrice;
}, {
  message: "Debes configurar al menos un precio",
});

type GaragePricingForm = z.infer<typeof garagePricingSchema>;

export default function GaragePricingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [nextStep, setNextStep] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<GaragePricingForm>({
    resolver: zodResolver(garagePricingSchema),
    defaultValues: {
      hourlyPrice: undefined,
      dailyPrice: undefined,
      monthlyPrice: undefined,
    },
  });

  const watchedHourlyPrice = watch("hourlyPrice");
  const watchedDailyPrice = watch("dailyPrice");
  const watchedMonthlyPrice = watch("monthlyPrice");

  // All hooks must be called before any conditional returns
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
    // Check if we have location and details data from previous steps
    const locationData = sessionStorage.getItem("garageLocation");
    const detailsData = sessionStorage.getItem("garageDetails");

    if (!locationData || !detailsData) {
      router.push("/setup/garage");
    }

    // Get next step info
    const nextStepData = sessionStorage.getItem("garageNextStep");
    setNextStep(nextStepData);
  }, [router]);

  // Early returns must happen after all hooks are called
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

  const onSubmit = async (data: GaragePricingForm) => {
    setIsLoading(true);
    try {
      // Store pricing data in sessionStorage for next step
      sessionStorage.setItem("garagePricing", JSON.stringify(data));
      router.push("/setup/garage/availability");
    } catch (error) {
      alert("Error al guardar los precios");
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
      <div className="mx-auto max-w-sm md:max-w-2xl lg:max-w-4xl bg-white min-h-screen md:min-h-0 md:my-8 md:rounded-2xl md:shadow-xl">
        <div className="px-6 md:px-8 lg:px-12 pt-8 md:pt-6 lg:pt-8">
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
            <ProgressBar currentStep={3} totalSteps={6} className="mb-6" />
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Establecer precios
            </h2>
            <p className="text-gray-600 text-sm">
              Configurá los precios para tu espacio de estacionamiento
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Hourly Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Precio por hora
              </label>
              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent">
                  <div className="pl-4 pr-2 py-3">
                    <ClockIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    {...register("hourlyPrice", { valueAsNumber: true })}
                    type="number"
                    placeholder="Ej: 500"
                    min="0"
                    step="10"
                    className="flex-1 py-3 border-0 focus:ring-0 text-lg font-semibold"
                  />
                  <div className="pr-4 pl-2 py-3 text-gray-500 font-medium">
                    $/hora
                  </div>
                </div>
              </div>
              {errors.hourlyPrice && (
                <p className="text-red-500 text-xs mt-1">{errors.hourlyPrice.message}</p>
              )}
            </div>

            {/* Daily Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Precio por día
              </label>
              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent">
                  <div className="pl-4 pr-2 py-3">
                    <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    {...register("dailyPrice", { valueAsNumber: true })}
                    type="number"
                    placeholder="Ej: 3000"
                    min="0"
                    step="50"
                    className="flex-1 py-3 border-0 focus:ring-0 text-lg font-semibold"
                  />
                  <div className="pr-4 pl-2 py-3 text-gray-500 font-medium">
                    $/día
                  </div>
                </div>
              </div>
              {errors.dailyPrice && (
                <p className="text-red-500 text-xs mt-1">{errors.dailyPrice.message}</p>
              )}
            </div>

            {/* Monthly Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Precio mensual
              </label>
              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent">
                  <div className="pl-4 pr-2 py-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    {...register("monthlyPrice", { valueAsNumber: true })}
                    type="number"
                    placeholder="Ej: 15000"
                    min="0"
                    step="100"
                    className="flex-1 py-3 border-0 focus:ring-0 text-lg font-semibold"
                  />
                  <div className="pr-4 pl-2 py-3 text-gray-500 font-medium">
                    $/mes
                  </div>
                </div>
              </div>
              {errors.monthlyPrice && (
                <p className="text-red-500 text-xs mt-1">{errors.monthlyPrice.message}</p>
              )}
            </div>

            {/* General Error */}
            {errors.root && (
              <p className="text-red-500 text-sm text-center">{errors.root.message}</p>
            )}

            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                💡 Consejos para fijar precios
              </h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Precio por hora: ideal para estacionamiento ocasional</li>
                <li>• Precio por día: conveniente para visitas prolongadas</li>
                <li>• Precio mensual: atractivo para residentes o empleados</li>
                <li>• Podés configurar uno o más precios según tu preferencia</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mt-8 pb-0 md:pb-8">
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
