"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ClockIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import ProgressBar from "@/components/ui/ProgressBar";
import { useSession } from "next-auth/react";

// Schema for availability schedule
const availabilityScheduleSchema = z.object({
  schedules: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
    endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
    isActive: z.boolean(),
  })).optional(),
});

type AvailabilityScheduleForm = z.infer<typeof availabilityScheduleSchema>;

interface DaySchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const DAYS_OF_WEEK = [
  { id: 1, name: "Lunes", short: "L" },
  { id: 2, name: "Martes", short: "M" },
  { id: 3, name: "Miércoles", short: "X" },
  { id: 4, name: "Jueves", short: "J" },
  { id: 5, name: "Viernes", short: "V" },
  { id: 6, name: "Sábado", short: "S" },
  { id: 0, name: "Domingo", short: "D" },
];

const DEFAULT_SCHEDULE: DaySchedule = {
  dayOfWeek: 0,
  startTime: "08:00",
  endTime: "20:00",
  isActive: false,
};

export default function GarageAvailabilityPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<DaySchedule[]>(
    DAYS_OF_WEEK.map(day => ({
      ...DEFAULT_SCHEDULE,
      dayOfWeek: day.id,
    }))
  );
  const [quickSetupMode, setQuickSetupMode] = useState<"weekdays" | "weekends" | "all" | null>(null);

  const {
    handleSubmit,
    formState: { errors },
  } = useForm<AvailabilityScheduleForm>({
    resolver: zodResolver(availabilityScheduleSchema),
  });

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
    // Check if we have previous step data
    const locationData = sessionStorage.getItem("garageLocation");
    const detailsData = sessionStorage.getItem("garageDetails");
    const pricingData = sessionStorage.getItem("garagePricing");

    if (!locationData || !detailsData || !pricingData) {
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

  const updateSchedule = (dayOfWeek: number, field: keyof DaySchedule, value: any) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.dayOfWeek === dayOfWeek 
        ? { ...schedule, [field]: value }
        : schedule
    ));
  };

  const applyQuickSetup = (mode: "weekdays" | "weekends" | "all") => {
    setQuickSetupMode(mode);
    setSchedules(prev => prev.map(schedule => {
      const isWeekday = schedule.dayOfWeek >= 1 && schedule.dayOfWeek <= 5;
      const isWeekend = schedule.dayOfWeek === 0 || schedule.dayOfWeek === 6;
      
      let shouldActivate = false;
      if (mode === "weekdays" && isWeekday) shouldActivate = true;
      if (mode === "weekends" && isWeekend) shouldActivate = true;
      if (mode === "all") shouldActivate = true;

      return {
        ...schedule,
        isActive: shouldActivate,
        startTime: shouldActivate ? "08:00" : schedule.startTime,
        endTime: shouldActivate ? "20:00" : schedule.endTime,
      };
    }));
  };

  const copyToAll = (sourceDay: DaySchedule) => {
    setSchedules(prev => prev.map(schedule => ({
      ...schedule,
      startTime: sourceDay.startTime,
      endTime: sourceDay.endTime,
      isActive: sourceDay.isActive,
    })));
  };

  const onSubmit = async () => {
    setIsLoading(true);
    try {
      // Filter only active schedules
      const activeSchedules = schedules.filter(schedule => schedule.isActive);
      
      // Store availability data in sessionStorage for next step
      sessionStorage.setItem("garageAvailability", JSON.stringify({ schedules: activeSchedules }));
      router.push("/setup/garage/photos");
    } catch (error) {
      alert("Error al guardar los horarios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Store empty availability data
    sessionStorage.setItem("garageAvailability", JSON.stringify({ schedules: [] }));
    
    if (nextStep === "vehicles") {
      router.push("/setup/vehicles?from=garage");
    } else {
      router.push("/setup/complete");
    }
  };

  const hasActiveSchedules = schedules.some(schedule => schedule.isActive);

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
            <ProgressBar currentStep={4} totalSteps={6} className="mb-6" />
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Horarios de disponibilidad
            </h2>
            <p className="text-gray-600 text-sm">
              Definí cuándo está disponible tu espacio para reservas
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Quick Setup Options */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-3">
                ⚡ Configuración rápida
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyQuickSetup("weekdays")}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    quickSetupMode === "weekdays"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-blue-700 border border-blue-300 hover:bg-blue-100"
                  }`}
                >
                  Días de semana
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickSetup("weekends")}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    quickSetupMode === "weekends"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-blue-700 border border-blue-300 hover:bg-blue-100"
                  }`}
                >
                  Fines de semana
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickSetup("all")}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    quickSetupMode === "all"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-blue-700 border border-blue-300 hover:bg-blue-100"
                  }`}
                >
                  Todos los días
                </button>
              </div>
            </div>

            {/* Days Schedule */}
            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day) => {
                const schedule = schedules.find(s => s.dayOfWeek === day.id);
                if (!schedule) return null;

                return (
                  <div key={day.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          schedule.isActive 
                            ? "bg-green-500 text-white" 
                            : "bg-gray-200 text-gray-500"
                        }`}>
                          {day.short}
                        </div>
                        <span className="font-medium text-gray-900">{day.name}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={schedule.isActive}
                          onChange={(e) => updateSchedule(day.id, "isActive", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>

                    {schedule.isActive && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Desde
                            </label>
                            <div className="relative">
                              <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="time"
                                value={schedule.startTime}
                                onChange={(e) => updateSchedule(day.id, "startTime", e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Hasta
                            </label>
                            <div className="relative">
                              <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="time"
                                value={schedule.endTime}
                                onChange={(e) => updateSchedule(day.id, "endTime", e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToAll(schedule)}
                          className="text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          Aplicar este horario a todos los días
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Info Section */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="text-sm font-medium text-yellow-900 mb-2">
                💡 Consejos para horarios
              </h3>
              <ul className="text-xs text-yellow-800 space-y-1">
                <li>• Los horarios definen cuándo se puede reservar tu espacio</li>
                <li>• Podés activar solo los días que te convengan</li>
                <li>• Los horarios se pueden modificar después desde tu dashboard</li>
                <li>• Si no configurás horarios, tu espacio estará disponible 24/7</li>
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

              {/* Skip Button */}
              <button
                type="button"
                onClick={handleSkip}
                className="w-full border border-gray-300 text-gray-700 font-medium py-4 px-6 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Configurar después
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
