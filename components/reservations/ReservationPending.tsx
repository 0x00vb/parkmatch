"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ClockIcon,
  MapPinIcon,
  CalendarDaysIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import ReservationHeader from "@/components/ui/ReservationHeader";
import { Reservation } from "@/types/reservation";

interface ReservationPendingProps {
  reservationId: string;
  onBack: () => void;
  onConfirmed: (reservation: Reservation) => void;
}

export default function ReservationPending({ reservationId, onBack, onConfirmed }: ReservationPendingProps) {
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState("");

  // Fetch reservation details
  useEffect(() => {
    const fetchReservation = async () => {
      try {
        console.log('Fetching reservation with ID:', reservationId);
        const response = await fetch(`/api/reservations/${reservationId}`);
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Reservation data:', data);
          setReservation(data.reservation);
          
          // If status changed to confirmed, trigger callback
          if (data.reservation.status === 'CONFIRMED') {
            onConfirmed(data.reservation);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log('Error response:', errorData);
          setError(errorData.error || "Error al cargar la reserva");
        }
      } catch (error) {
        console.error('Fetch error:', error);
        setError("Error de conexión");
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay before first fetch to ensure reservation is fully created
    const timeoutId = setTimeout(fetchReservation, 500);

    // Poll for status updates every 5 seconds
    const interval = setInterval(fetchReservation, 5000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [reservationId, onConfirmed]);

  const handleCancelReservation = async () => {
    if (!reservation) return;

    setIsCancelling(true);
    setError("");

    try {
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard?section=reservas');
      } else {
        const data = await response.json();
        setError(data.error || "Error al cancelar la reserva");
      }
    } catch (error) {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reserva...</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Reserva no encontrada</p>
          <button 
            onClick={onBack}
            className="text-green-600 hover:text-green-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const ownerName = reservation.garage.user.firstName && reservation.garage.user.lastName
    ? `${reservation.garage.user.firstName} ${reservation.garage.user.lastName}`
    : reservation.garage.user.name || "Propietario";

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-sm bg-white min-h-screen">
        {/* Header */}
        <ReservationHeader title="Solicitud enviada" onBack={onBack} />

        <div className="p-6">
          {/* Status Icon and Message */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 relative">
              <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center animate-pulse">
                  <ClockIcon className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="absolute inset-0 border-4 border-green-300 border-dashed rounded-full animate-spin opacity-30"></div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Solicitud enviada
            </h2>
            <p className="text-gray-600 text-center leading-relaxed">
              Esperando la confirmación del propietario. Te notificaremos en cuanto responda.
            </p>
          </div>

          {/* Reservation Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Resumen de la reserva</h3>
            
            <div className="space-y-3">
              {/* Address */}
              <div className="flex items-start">
                <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{reservation.garage.address}</p>
                  <p className="text-sm text-gray-600">{reservation.garage.city}</p>
                </div>
              </div>

              {/* Date and Time */}
              <div className="flex items-start">
                <CalendarDaysIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {formatDate(reservation.startTime)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                  </p>
                </div>
              </div>

              {/* Vehicle */}
              <div className="flex items-start">
                <TruckIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">
                    {reservation.vehicle.brand} {reservation.vehicle.model}
                  </p>
                  <p className="text-sm text-gray-600">
                    {reservation.vehicle.licensePlate}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
              Pendiente
            </div>
          </div>

          {/* Price */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Total a pagar</span>
              <span className="text-2xl font-bold text-gray-900">
                ${reservation.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Cancel Button */}
          <button
            onClick={handleCancelReservation}
            disabled={isCancelling}
            className="w-full py-3 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCancelling ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 mr-2"></div>
                Cancelando...
              </div>
            ) : (
              'Cancelar Solicitud'
            )}
          </button>

          {/* Info Text */}
          <p className="text-xs text-gray-500 text-center mt-4 leading-relaxed">
            Puedes cancelar tu solicitud mientras no haya sido confirmada por el propietario.
          </p>
        </div>
      </div>
    </div>
  );
}
