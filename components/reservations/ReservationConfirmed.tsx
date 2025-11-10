"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  MapPinIcon,
  CalendarDaysIcon,
  TruckIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import ReservationHeader from "@/components/ui/ReservationHeader";
import { Reservation } from "@/types/reservation";

interface ReservationConfirmedProps {
  reservation: Reservation;
  onBack: () => void;
}

export default function ReservationConfirmed({ reservation, onBack }: ReservationConfirmedProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState("");

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

  const handleStartNavigation = () => {
    // Open Google Maps with directions
    const destination = `${reservation.garage.latitude},${reservation.garage.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const handleContact = () => {
    if (reservation.garage.user.phone) {
      window.open(`tel:${reservation.garage.user.phone}`, '_self');
    }
  };

  const handleCancelReservation = async () => {
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

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-sm bg-white min-h-screen h-full overflow-y-auto">
        {/* Header */}
        <ReservationHeader title="Confirmación de Reserva" onBack={onBack} />

        <div className="p-6">
          {/* Success Icon and Message */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-12 h-12 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Reserva confirmada!
            </h2>
            <p className="text-gray-600 text-center leading-relaxed">
              Tu lugar está asegurado. ¡Buen viaje!
            </p>
          </div>

          {/* Host Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-semibold text-lg">
                  {ownerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Tu anfitrión</p>
                <p className="text-gray-600">{ownerName}</p>
              </div>
            </div>
          </div>

          {/* Reservation Details */}
          <div className="space-y-4 mb-6">
            {/* Address */}
            <div className="flex items-start">
              <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3 shrink-0" />
              <div>
                <p className="font-medium text-gray-900">{reservation.garage.address}</p>
                <p className="text-sm text-gray-600">{reservation.garage.city}</p>
              </div>
            </div>

            {/* Date and Time */}
            <div className="flex items-start">
              <CalendarDaysIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3 shrink-0" />
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
              <TruckIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3 shrink-0" />
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

          {/* Total Paid */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Total pagado</span>
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

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Start Navigation */}
            <button
              onClick={handleStartNavigation}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <MapPinIcon className="w-5 h-5 mr-2" />
              Iniciar Navegación GPS
            </button>

            {/* Contact and Cancel Row */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleContact}
                disabled={!reservation.garage.user.phone}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <PhoneIcon className="w-5 h-5 mr-2" />
                Contactar
              </button>

              <button
                onClick={handleCancelReservation}
                disabled={isCancelling}
                className="flex-1 border border-red-300 text-red-600 py-3 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCancelling ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  </div>
                ) : (
                  'Cancelar'
                )}
              </button>
            </div>
          </div>

          {/* Info Text */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800 text-center leading-relaxed">
              💡 Recuerda llegar puntual y seguir las indicaciones del anfitrión para acceder al estacionamiento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
