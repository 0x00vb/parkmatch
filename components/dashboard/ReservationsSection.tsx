"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  CalendarDaysIcon,
  MapPinIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import ReservationPending from "@/components/reservations/ReservationPending";
import ReservationConfirmed from "@/components/reservations/ReservationConfirmed";
import ActiveReservationModal from "@/components/reservations/ActiveReservationModal";
import { Reservation } from "@/types/reservation";

export default function ReservationsSection() {
  const { data: session } = useSession();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "pending" | "confirmed">("list");
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [error, setError] = useState("");

  // Fetch reservations
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await fetch('/api/reservations');
        if (response.ok) {
          const data = await response.json();
          setReservations(data.reservations || []);
          
          // Check for active reservation
          const active = data.reservations?.find((r: Reservation) => r.status === 'ACTIVE');
          if (active) {
            setActiveReservation(active);
          }
        } else {
          setError("Error al cargar las reservas");
        }
      } catch (error) {
        setError("Error de conexión");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchReservations();
    }
  }, [session]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Pendiente',
          color: 'bg-yellow-100 text-yellow-800',
          icon: ClockIcon,
        };
      case 'CONFIRMED':
        return {
          label: 'Confirmada',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircleIcon,
        };
      case 'ACTIVE':
        return {
          label: 'Activa',
          color: 'bg-blue-100 text-blue-800',
          icon: ExclamationTriangleIcon,
        };
      case 'COMPLETED':
        return {
          label: 'Completada',
          color: 'bg-gray-100 text-gray-800',
          icon: CheckCircleIcon,
        };
      case 'CANCELLED':
        return {
          label: 'Cancelada',
          color: 'bg-red-100 text-red-800',
          icon: XCircleIcon,
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800',
          icon: ClockIcon,
        };
    }
  };

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    
    if (reservation.status === 'PENDING') {
      setViewMode('pending');
    } else if (reservation.status === 'CONFIRMED') {
      setViewMode('confirmed');
    } else if (reservation.status === 'ACTIVE') {
      setShowActiveModal(true);
    }
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedReservation(null);
  };

  const handleReservationConfirmed = (reservation: Reservation) => {
    // Update the reservation in the list
    setReservations(prev => 
      prev.map(r => r.id === reservation.id ? reservation : r)
    );
    setSelectedReservation(reservation);
    setViewMode('confirmed');
  };

  const handleCheckIn = async () => {
    if (!activeReservation) return;

    try {
      const response = await fetch(`/api/reservations/${activeReservation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (response.ok) {
        const data = await response.json();
        setReservations(prev => 
          prev.map(r => r.id === activeReservation.id ? data.reservation : r)
        );
        setActiveReservation(null);
        setShowActiveModal(false);
      }
    } catch (error) {
      console.error('Error during check-in:', error);
    }
  };

  const handleCancelActiveReservation = async () => {
    if (!activeReservation) return;

    try {
      const response = await fetch(`/api/reservations/${activeReservation.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReservations(prev => 
          prev.filter(r => r.id !== activeReservation.id)
        );
        setActiveReservation(null);
        setShowActiveModal(false);
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
    }
  };

  // Show specific reservation views
  if (viewMode === 'pending' && selectedReservation) {
    return (
      <ReservationPending
        reservationId={selectedReservation.id}
        onBack={handleBack}
        onConfirmed={handleReservationConfirmed}
      />
    );
  }

  if (viewMode === 'confirmed' && selectedReservation) {
    return (
      <ReservationConfirmed
        reservation={selectedReservation}
        onBack={handleBack}
      />
    );
  }

  // Main reservations list view
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mis Reservas</h1>
        <p className="text-gray-600">Gestiona tus reservas de estacionamiento</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando reservas...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-green-600 font-medium"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No tienes reservas aún</p>
              <p className="text-sm text-gray-500">
                Busca una cochera en la sección Inicio para hacer tu primera reserva
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-6 h-full">
            {reservations.map((reservation) => {
              const statusConfig = getStatusConfig(reservation.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={reservation.id}
                  onClick={() => handleReservationClick(reservation)}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  {/* Header with status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.label}
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      ${reservation.totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Address */}
                  <div className="flex items-start mb-2">
                    <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {reservation.garage.address}
                      </p>
                      <p className="text-xs text-gray-600">
                        {reservation.garage.city}
                      </p>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center mb-2">
                    <CalendarDaysIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {formatDate(reservation.startTime)} • {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                    </span>
                  </div>

                  {/* Vehicle */}
                  <div className="flex items-center">
                    <TruckIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {reservation.vehicle.brand} {reservation.vehicle.model} • {reservation.vehicle.licensePlate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Reservation Modal */}
      {showActiveModal && activeReservation && (
        <ActiveReservationModal
          reservation={activeReservation}
          onClose={() => setShowActiveModal(false)}
          onCheckIn={handleCheckIn}
          onCancel={handleCancelActiveReservation}
        />
      )}
    </div>
  );
}
