"use client";

import { useState, useEffect, useRef } from "react";
import {
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import ModalHeader from "@/components/ui/ModalHeader";

interface ActiveReservation {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  garage: {
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    user: {
      firstName?: string;
      lastName?: string;
      name?: string;
      phone?: string;
    };
  };
}

interface ActiveReservationModalProps {
  reservation: ActiveReservation;
  onClose: () => void;
  onCheckIn: () => void;
  onCancel: () => void;
  isMinimized?: boolean;
  onMinimize?: () => void;
  onExpand?: () => void;
}

export default function ActiveReservationModal({ 
  reservation, 
  onClose, 
  onCheckIn, 
  onCancel,
  isMinimized = false,
  onMinimize,
  onExpand
}: ActiveReservationModalProps) {
  const [timeDisplay, setTimeDisplay] = useState({ time: "", label: "", description: "" });
  const [isCancelling, setIsCancelling] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Calculate time remaining until start or end of reservation
  const calculateTimeRemaining = () => {
    const now = new Date();
    const startTime = new Date(reservation.startTime);
    const endTime = new Date(reservation.endTime);

    if (now < startTime) {
      // Reservation hasn't started yet - show time until start
      const timeDiff = startTime.getTime() - now.getTime();
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      const timeString = startTime.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      
      let description = "";
      if (hours > 0) {
        description = `En ${hours}h ${minutes}m`;
      } else {
        description = `En ${minutes} minutos`;
      }

      return {
        time: timeString,
        label: "Inicio de reserva",
        description: description
      };
    } else if (now >= startTime && now <= endTime) {
      // Reservation is active - show time until end
      const timeDiff = endTime.getTime() - now.getTime();
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      const timeString = endTime.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      
      let description = "";
      if (hours > 0) {
        description = `Termina en ${hours}h ${minutes}m`;
      } else {
        description = `Termina en ${minutes} minutos`;
      }

      return {
        time: timeString,
        label: "Fin de reserva",
        description: description
      };
    } else {
      // Reservation has ended
      return {
        time: endTime.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        label: "Reserva finalizada",
        description: "La reserva ha terminado"
      };
    }
  };

  // Update time display in real-time
  useEffect(() => {
    const updateTimeDisplay = () => {
      setTimeDisplay(calculateTimeRemaining());
    };

    // Update immediately
    updateTimeDisplay();

    // Update every minute
    const interval = setInterval(updateTimeDisplay, 60000);

    return () => clearInterval(interval);
  }, [reservation.startTime, reservation.endTime]);

  // Update minimized display in real-time (force re-render)
  const [, forceUpdate] = useState({});
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate({});
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Get modal title based on reservation status
  const getModalTitle = () => {
    const now = new Date();
    const startTime = new Date(reservation.startTime);
    const endTime = new Date(reservation.endTime);

    if (now < startTime) {
      return "Reserva pendiente";
    } else if (now >= startTime && now <= endTime) {
      return "Reserva activa";
    } else {
      return "Reserva finalizada";
    }
  };

  // Get time display for minimized modal
  const getMinimizedTimeDisplay = () => {
    const now = new Date();
    const startTime = new Date(reservation.startTime);
    const endTime = new Date(reservation.endTime);

    if (now < startTime) {
      // Reservation hasn't started yet - show time until start
      const timeDiff = startTime.getTime() - now.getTime();
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    } else if (now >= startTime && now <= endTime) {
      // Reservation is active - show time until end
      const timeDiff = endTime.getTime() - now.getTime();
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    } else {
      // Reservation has ended
      return "Finalizada";
    }
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

  const handleContact = () => {
    if (reservation.garage.user.phone) {
      window.open(`tel:${reservation.garage.user.phone}`, '_self');
    }
  };

  const handleCancelReservation = async () => {
    setIsCancelling(true);
    try {
      await onCancel();
    } finally {
      setIsCancelling(false);
    }
  };

  const handleMinimize = () => {
    onMinimize?.();
  };

  const handleExpand = () => {
    onExpand?.();
  };

  // Handle clicks outside the modal to minimize (only when expanded)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && !isMinimized) {
        handleMinimize();
      }
    };

    if (!isMinimized) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMinimized]);

  // Render minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-22 md:bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={handleExpand}
          className="bg-white rounded-full px-4 py-2 md:px-6 md:py-3 shadow-lg border border-gray-200 flex items-center gap-2 hover:shadow-xl transition-all duration-300 animate-slide-down"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <ClockIcon className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
          <span className="text-sm md:text-base font-medium text-gray-900">
            {getMinimizedTimeDisplay()}
          </span>
          <ChevronUpIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-end md:items-center justify-center z-50 pointer-events-none">
      <div 
        ref={modalRef}
        className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-sm md:max-w-md lg:max-w-lg mx-auto animate-slide-up shadow-2xl pointer-events-auto max-h-[85vh] md:max-h-[80vh] overflow-hidden mb-16 md:mb-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={handleMinimize}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronDownIcon className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{getModalTitle()}</h1>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Time Info */}
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {timeDisplay.time}
            </div>
            <p className="text-green-600 font-medium">
              {timeDisplay.label}
            </p>
            <p className="text-sm text-gray-600">
              {timeDisplay.description}
            </p>
          </div>

          {/* Destination */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">
                  {reservation.garage.address}
                </p>
                <p className="text-xs text-gray-600">
                  {reservation.garage.city}
                </p>
              </div>
            </div>
          </div>

          {/* Host Contact */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold text-sm">
                    {ownerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Anfitrión: {ownerName}</p>
                  <p className="text-xs text-gray-600">
                    {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                  </p>
                </div>
              </div>
              
              {reservation.garage.user.phone && (
                <button
                  onClick={handleContact}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                  <PhoneIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Cancel Button */}
            <button
              onClick={handleCancelReservation}
              disabled={isCancelling}
              className="w-full border border-red-300 text-red-600 py-3 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 mr-2"></div>
                  Cancelando...
                </div>
              ) : (
                'Cancelar reserva'
              )}
            </button>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        @keyframes slide-down {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
