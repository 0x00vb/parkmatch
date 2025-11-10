"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ClockIcon,
  CalendarDaysIcon,
  TruckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import ReservationHeader from "@/components/ui/ReservationHeader";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year?: number;
  licensePlate: string;
  height?: number;
  width?: number;
  length?: number;
  minHeight?: number;
  coveredOnly: boolean;
}

interface Garage {
  id: string;
  address: string;
  city: string;
  type: "COVERED" | "UNCOVERED";
  height: number;
  width: number;
  length: number;
  hourlyPrice?: number;
  dailyPrice?: number;
  monthlyPrice?: number;
  user: {
    firstName?: string;
    lastName?: string;
    name?: string;
  };
}

interface ReservationFormProps {
  garage: Garage;
  onBack: () => void;
  onSuccess: (reservationId: string) => void;
}

export default function ReservationForm({ garage, onBack, onSuccess }: ReservationFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [error, setError] = useState("");
  const [timeError, setTimeError] = useState("");

  // Set default date and times to future
  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Round up to next 15-minute interval
    const currentMinutes = now.getMinutes();
    const minutesToAdd = (15 - (currentMinutes % 15)) % 15;
    const roundedTime = new Date(now.getTime() + minutesToAdd * 60000);

    // If we're already past the rounded time, add another 15 minutes
    if (roundedTime <= now) {
      roundedTime.setMinutes(roundedTime.getMinutes() + 15);
    }

    // Set start time to rounded time
    const startTimeString = roundedTime.toTimeString().substring(0, 5); // HH:MM format

    // Set end time to 1 hour later
    const endTime = new Date(roundedTime.getTime() + 60 * 60000);
    const endTimeString = endTime.toTimeString().substring(0, 5);

    setSelectedDate(today);
    setStartTime(startTimeString);
    setEndTime(endTimeString);
  }, []);

  // Validate time selection in real-time
  useEffect(() => {
    if (!selectedDate || !startTime) {
      setTimeError("");
      return;
    }

    const start = new Date(`${selectedDate}T${startTime}`);
    const now = new Date();

    if (start <= now) {
      setTimeError("La hora de inicio debe ser en el futuro");
    } else if (startTime && endTime) {
      const end = new Date(`${selectedDate}T${endTime}`);
      if (end <= start) {
        setTimeError("La hora de fin debe ser posterior a la hora de inicio");
      } else {
        setTimeError("");
      }
    } else {
      setTimeError("");
    }
  }, [selectedDate, startTime, endTime]);

  // Fetch user's vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('/api/vehicles');
        if (response.ok) {
          const data = await response.json();
          setVehicles(data.vehicles || []);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    if (session?.user?.id) {
      fetchVehicles();
    }
  }, [session]);


  // Check vehicle compatibility
  const checkVehicleCompatibility = (vehicle: Vehicle) => {
    const issues: string[] = [];

    if (vehicle.height && garage.height && vehicle.height > garage.height) {
      issues.push(`Altura del vehículo (${vehicle.height}m) excede la del garage (${garage.height}m)`);
    }

    if (vehicle.width && garage.width && vehicle.width > garage.width) {
      issues.push(`Ancho del vehículo (${vehicle.width}m) excede el del garage (${garage.width}m)`);
    }

    if (vehicle.length && garage.length && vehicle.length > garage.length) {
      issues.push(`Largo del vehículo (${vehicle.length}m) excede el del garage (${garage.length}m)`);
    }

    if (vehicle.coveredOnly && garage.type !== "COVERED") {
      issues.push("El vehículo requiere cochera cubierta");
    }

    if (vehicle.minHeight && garage.height && garage.height < vehicle.minHeight) {
      issues.push(`Altura mínima requerida: ${vehicle.minHeight}m, garage: ${garage.height}m`);
    }

    return {
      compatible: issues.length === 0,
      issues,
    };
  };

  // Calculate total price based on duration and pricing tiers
  const calculateTotalPrice = () => {
    if (!startTime || !endTime) return { price: 0, pricingType: 'hourly' as const, breakdown: '' };

    const start = new Date(`${selectedDate}T${startTime}`);
    const end = new Date(`${selectedDate}T${endTime}`);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = Math.max(durationMs / (1000 * 60 * 60), 1);
    const durationDays = durationHours / 24;
    const durationMonths = durationDays / 30; // Approximate month as 30 days

    let price: number;
    let pricingType: 'hourly' | 'daily' | 'monthly';
    let breakdown: string;

    // Determine pricing strategy based on duration and available prices
    if (durationHours < 24 && garage.hourlyPrice) {
      // Use hourly pricing for reservations less than 24 hours
      price = garage.hourlyPrice * durationHours;
      pricingType = 'hourly';
      breakdown = `${durationHours.toFixed(1)} horas × $${garage.hourlyPrice}/hora`;
    } else if (durationDays < 7 && garage.dailyPrice) {
      // Use daily pricing for reservations 1-7 days
      const days = Math.ceil(durationDays);
      price = garage.dailyPrice * days;
      pricingType = 'daily';
      breakdown = `${days} día${days > 1 ? 's' : ''} × $${garage.dailyPrice}/día`;
    } else if (durationDays >= 7 && garage.monthlyPrice) {
      // Use monthly pricing for reservations 7+ days
      const months = Math.ceil(durationMonths);
      price = garage.monthlyPrice * months;
      pricingType = 'monthly';
      breakdown = `${months} mes${months > 1 ? 'es' : ''} × $${garage.monthlyPrice}/mes`;
    } else if (garage.dailyPrice) {
      // Fallback to daily pricing if monthly not available
      const days = Math.ceil(durationDays);
      price = garage.dailyPrice * days;
      pricingType = 'daily';
      breakdown = `${days} día${days > 1 ? 's' : ''} × $${garage.dailyPrice}/día`;
    } else if (garage.hourlyPrice) {
      // Final fallback to hourly pricing
      price = garage.hourlyPrice * durationHours;
      pricingType = 'hourly';
      breakdown = `${durationHours.toFixed(1)} horas × $${garage.hourlyPrice}/hora`;
    } else {
      return { price: 0, pricingType: 'hourly' as const, breakdown: 'Precio no disponible' };
    }

    // Apply peak hour pricing (7-9 AM, 5-7 PM on weekdays)
    const hour = start.getHours();
    const isWeekday = start.getDay() >= 1 && start.getDay() <= 5;
    const isPeakHour = isWeekday && ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19));

    if (isPeakHour) {
      price *= 1.2; // 20% extra for peak hours
      breakdown += ' (hora pico: +20%)';
    }

    // Apply weekend pricing
    const isWeekend = start.getDay() === 0 || start.getDay() === 6;
    if (isWeekend) {
      price *= 1.1; // 10% extra for weekends
      breakdown += ' (fin de semana: +10%)';
    }

    return {
      price: Math.round(Math.max(0, price) * 100) / 100,
      pricingType,
      breakdown
    };
  };

  // Validate form
  const isFormValid = () => {
    if (!selectedDate || !startTime || !endTime || !selectedVehicleId) {
      return false;
    }

    const start = new Date(`${selectedDate}T${startTime}`);
    const end = new Date(`${selectedDate}T${endTime}`);
    const now = new Date();

    // Check if start time is in the future
    if (start <= now) {
      return false;
    }

    if (end <= start) {
      return false;
    }

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (!selectedVehicle) {
      return false;
    }

    const compatibility = checkVehicleCompatibility(selectedVehicle);
    return compatibility.compatible;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsLoading(true);
    setError("");
    setTimeError("");

    try {
      const startDateTime = new Date(`${selectedDate}T${startTime}`);
      const endDateTime = new Date(`${selectedDate}T${endTime}`);

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          garageId: garage.id,
          vehicleId: selectedVehicleId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Reservation created successfully:", data.reservation);
        console.log("Reservation ID:", data.reservation.id);
        onSuccess(data.reservation.id);
      } else {
        console.log("Error creating reservation:", data);
        setError(data.error || "Error al crear la reserva");
      }
    } catch (error) {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const compatibility = selectedVehicle ? checkVehicleCompatibility(selectedVehicle) : null;
  const priceCalculation = calculateTotalPrice();

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-sm bg-white min-h-screen">
        {/* Header */}
        <ReservationHeader title="Reservar tu lugar" onBack={onBack} />

        <div className="p-6 space-y-6">
          {/* Date Selection */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              Seleccioná fecha y hora
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <div className="relative">
                  <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desde
                  </label>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      min={selectedDate === new Date().toISOString().split('T')[0] ? new Date().toTimeString().substring(0, 5) : undefined}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hasta
                  </label>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Time validation error */}
              {timeError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{timeError}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">
                Elegí tu vehículo
              </h2>
              <button
                onClick={() => router.push('/dashboard?section=vehiculos')}
                className="text-green-600 text-sm font-medium"
              >
                Agregar
              </button>
            </div>

            {isLoadingVehicles ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando vehículos...</p>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-8">
                <TruckIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-3">No tienes vehículos registrados</p>
                <button
                  onClick={() => router.push('/dashboard?section=vehiculos')}
                  className="text-green-600 font-medium"
                >
                  Agregar vehículo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map((vehicle) => {
                  const vehicleCompatibility = checkVehicleCompatibility(vehicle);
                  const isSelected = selectedVehicleId === vehicle.id;
                  
                  return (
                    <div
                      key={vehicle.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? vehicleCompatibility.compatible
                            ? 'border-green-500 bg-green-50'
                            : 'border-red-500 bg-red-50'
                          : vehicleCompatibility.compatible
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-red-200 bg-red-50'
                      }`}
                      onClick={() => {
                        if (vehicleCompatibility.compatible) {
                          setSelectedVehicleId(vehicle.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {vehicle.brand} {vehicle.model}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {vehicle.licensePlate} • {vehicle.year || 'S/A'}
                          </p>
                        </div>
                        
                        {!vehicleCompatibility.compatible && (
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0 ml-2" />
                        )}
                      </div>

                      {!vehicleCompatibility.compatible && (
                        <div className="mt-2 p-2 bg-red-100 rounded text-sm">
                          <p className="text-red-800 font-medium mb-1">No compatible:</p>
                          <ul className="text-red-700 space-y-1">
                            {vehicleCompatibility.issues.map((issue, index) => (
                              <li key={index}>• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Price Summary */}
          {priceCalculation.price > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Total a pagar</span>
                <span className="text-xl font-bold text-gray-900">
                  ${priceCalculation.price.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                {priceCalculation.breakdown}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-pb">
          <div className="max-w-sm mx-auto">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid() || isLoading}
              className={`w-full py-3 rounded-lg font-semibold text-base transition-colors ${
                isFormValid() && !isLoading
                  ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Procesando...
                </div>
              ) : (
                'Reserva'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
