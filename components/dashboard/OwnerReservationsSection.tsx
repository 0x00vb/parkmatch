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
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

interface OwnerReservation {
  id: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  garage: {
    id: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    hourlyPrice?: number;
  };
  vehicle: {
    brand: string;
    model: string;
    licensePlate: string;
    year?: number;
  };
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
    email?: string;
  };
}

interface GroupedReservations {
  pending: OwnerReservation[];
  confirmed: OwnerReservation[];
  active: OwnerReservation[];
  completed: OwnerReservation[];
  cancelled: OwnerReservation[];
}

export default function OwnerReservationsSection() {
  const { data: session } = useSession();
  const [reservations, setReservations] = useState<OwnerReservation[]>([]);
  const [groupedReservations, setGroupedReservations] = useState<GroupedReservations>({
    pending: [],
    confirmed: [],
    active: [],
    completed: [],
    cancelled: [],
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingReservation, setProcessingReservation] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"pending" | "all">("pending");

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch owner's reservations
  useEffect(() => {
    const fetchOwnerReservations = async () => {
      try {
        const response = await fetch('/api/owner/reservations');
        if (response.ok) {
          const data = await response.json();
          
          // Check for new pending reservations for notifications
          const newPendingCount = data.stats?.pending || 0;
          const currentPendingCount = stats.pending;
          
          if (currentPendingCount > 0 && newPendingCount > currentPendingCount) {
            // Show notification for new reservations
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Nueva solicitud de reserva', {
                body: `Tienes ${newPendingCount - currentPendingCount} nueva(s) solicitud(es) de reserva`,
                icon: '/favicon.ico',
              });
            }
          }
          
          setReservations(data.reservations || []);
          setGroupedReservations(data.groupedReservations || {
            pending: [],
            confirmed: [],
            active: [],
            completed: [],
            cancelled: [],
          });
          setStats(data.stats || {
            total: 0,
            pending: 0,
            confirmed: 0,
            active: 0,
            completed: 0,
            cancelled: 0,
          });
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Error al cargar las solicitudes");
        }
      } catch (error) {
        setError("Error de conexión");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id && session.user.role === "CONDUCTOR_PROPIETARIO") {
      fetchOwnerReservations();
      
      // Set up polling for real-time updates every 30 seconds
      const interval = setInterval(fetchOwnerReservations, 30000);
      
      return () => clearInterval(interval);
    }
  }, [session, stats.pending]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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

  const getUserName = (user: OwnerReservation['user']) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || "Usuario";
  };

  const handleAcceptReservation = async (reservationId: string) => {
    setProcessingReservation(reservationId);
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setReservations(prev => 
          prev.map(r => r.id === reservationId ? { ...r, status: 'CONFIRMED' } : r)
        );
        setGroupedReservations(prev => ({
          ...prev,
          pending: prev.pending.filter(r => r.id !== reservationId),
          confirmed: [...prev.confirmed, { ...prev.pending.find(r => r.id === reservationId)!, status: 'CONFIRMED' }],
        }));
        setStats(prev => ({
          ...prev,
          pending: prev.pending - 1,
          confirmed: prev.confirmed + 1,
        }));
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error al aceptar la reserva");
      }
    } catch (error) {
      setError("Error de conexión");
    } finally {
      setProcessingReservation(null);
    }
  };

  const handleRejectReservation = async (reservationId: string) => {
    setProcessingReservation(reservationId);
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      if (response.ok) {
        // Update local state
        setReservations(prev => 
          prev.map(r => r.id === reservationId ? { ...r, status: 'CANCELLED' } : r)
        );
        setGroupedReservations(prev => ({
          ...prev,
          pending: prev.pending.filter(r => r.id !== reservationId),
          cancelled: [...prev.cancelled, { ...prev.pending.find(r => r.id === reservationId)!, status: 'CANCELLED' }],
        }));
        setStats(prev => ({
          ...prev,
          pending: prev.pending - 1,
          cancelled: prev.cancelled + 1,
        }));
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error al rechazar la reserva");
      }
    } catch (error) {
      setError("Error de conexión");
    } finally {
      setProcessingReservation(null);
    }
  };

  const handleContactUser = (user: OwnerReservation['user']) => {
    if (user.phone) {
      window.open(`tel:${user.phone}`, '_self');
    } else if (user.email) {
      window.open(`mailto:${user.email}`, '_self');
    }
  };

  const renderReservationCard = (reservation: OwnerReservation) => {
    const statusConfig = getStatusConfig(reservation.status);
    const StatusIcon = statusConfig.icon;
    const userName = getUserName(reservation.user);
    const isProcessing = processingReservation === reservation.id;

    return (
      <div
        key={reservation.id}
        className="bg-white border border-gray-200 rounded-lg p-4 space-y-4"
      >
        {/* Header with status and price */}
        <div className="flex items-center justify-between">
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${statusConfig.color}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </div>
          <span className="text-lg font-bold text-gray-900">
            ${reservation.totalPrice.toFixed(2)}
          </span>
        </div>

        {/* User Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{userName}</p>
              <p className="text-sm text-gray-600">Conductor</p>
            </div>
          </div>
          
          {(reservation.user.phone || reservation.user.email) && (
            <button
              onClick={() => handleContactUser(reservation.user)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            >
              {reservation.user.phone ? (
                <PhoneIcon className="w-5 h-5" />
              ) : (
                <EnvelopeIcon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* Garage Address */}
        <div className="flex items-start">
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
        <div className="flex items-center">
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
            {reservation.vehicle.year && ` • ${reservation.vehicle.year}`}
          </span>
        </div>

        {/* Actions for pending reservations */}
        {reservation.status === 'PENDING' && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => handleAcceptReservation(reservation.id)}
              disabled={isProcessing}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </div>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                  Aceptar
                </>
              )}
            </button>
            <button
              onClick={() => handleRejectReservation(reservation.id)}
              disabled={isProcessing}
              className="flex-1 border border-red-300 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                </div>
              ) : (
                <>
                  <XCircleIcon className="w-4 h-4 inline mr-1" />
                  Rechazar
                </>
              )}
            </button>
          </div>
        )}

        {/* Created date */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
          Solicitud recibida: {formatDate(reservation.createdAt)} a las {formatTime(reservation.createdAt)}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
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
    );
  }

  const displayReservations = selectedTab === "pending" 
    ? groupedReservations.pending 
    : reservations;

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 pb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Solicitudes de Reserva</h1>
        <p className="text-gray-600">Gestiona las reservas de tus cocheras</p>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
            <div className="text-xs text-yellow-600">Pendientes</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-800">{stats.confirmed + stats.active}</div>
            <div className="text-xs text-green-600">Activas</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-4">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedTab("pending")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedTab === "pending"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Pendientes ({stats.pending})
          </button>
          <button
            onClick={() => setSelectedTab("all")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedTab === "all"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Todas ({stats.total})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 min-h-0 h-full overflow-y-auto">
        {displayReservations.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {selectedTab === "pending" 
                  ? "No tienes solicitudes pendientes" 
                  : "No has recibido solicitudes aún"
                }
              </p>
              <p className="text-sm text-gray-500">
                Las solicitudes aparecerán aquí cuando los usuarios reserven tus cocheras
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-6 h-full">
            {displayReservations.map(renderReservationCard)}
          </div>
        )}
      </div>
    </div>
  );
}
