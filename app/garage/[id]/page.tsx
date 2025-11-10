"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeftIcon,
  StarIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  CreditCardIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import dynamic from "next/dynamic";
import ReservationForm from "@/components/reservations/ReservationForm";
import ReservationPending from "@/components/reservations/ReservationPending";
import ReservationConfirmed from "@/components/reservations/ReservationConfirmed";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

interface AvailabilitySchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface Garage {
  id: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  type: "COVERED" | "UNCOVERED";
  height: number;
  width: number;
  length: number;
  hasGate: boolean;
  hasCameras: boolean;
  accessType: "REMOTE_CONTROL" | "KEYS";
  hourlyPrice?: number;
  dailyPrice?: number;
  monthlyPrice?: number;
  rules?: string;
  images: string[];
  isActive: boolean;
  createdAt: string;
  user: {
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  availabilitySchedules?: AvailabilitySchedule[];
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  createdAt: string;
}

export default function GarageDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const garageId = params.id as string;

  const [garage, setGarage] = useState<Garage | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<"details" | "reservation" | "pending" | "confirmed">("details");
  const [currentReservationId, setCurrentReservationId] = useState<string | null>(null);
  const [currentReservation, setCurrentReservation] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasPaymentMethods, setHasPaymentMethods] = useState<boolean | null>(null);

  // Mock reviews data - replace with API call later
  const mockReviews: Review[] = [
    {
      id: "1",
      rating: 5,
      comment: "Excelente ubicación y muy fácil de acceder. El dueño fue muy amable y el espacio era amplio. ¡Súper recomendado!",
      userName: "Laura G.",
      createdAt: "2024-01-15"
    },
    {
      id: "2", 
      rating: 4,
      comment: "Muy buena opción en el centro. Me salvó para una reunión. Un poco ajustado para mi camioneta pero entró bien.",
      userName: "Marcos R.",
      createdAt: "2024-01-10"
    }
  ];

  useEffect(() => {
    const fetchGarage = async () => {
      try {
        // For now, we'll fetch from the public garages endpoint
        const response = await fetch('/api/garages?public=true');
        if (response.ok) {
          const data = await response.json();
          const foundGarage = data.garages.find((g: Garage) => g.id === garageId);
          if (foundGarage) {
            setGarage(foundGarage);
            setReviews(mockReviews);
          }
        }
      } catch (error) {
        console.error('Error fetching garage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (garageId) {
      fetchGarage();
    }
  }, [garageId]);

  useEffect(() => {
    // Configure leaflet on client side
    if (typeof window !== "undefined") {
      import("@/lib/leaflet-config").then(({ configureLeaflet }) => {
        configureLeaflet();
        setIsMapLoaded(true);
      });
    }
  }, []);

  // Fetch user's payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch('/api/payment-methods');
        if (response.ok) {
          const data = await response.json();
          setHasPaymentMethods(data.methods && data.methods.length > 0);
        } else {
          // If payment methods service is not available, assume user has payment methods
          // to avoid blocking reservations during development/migration periods
          setHasPaymentMethods(true);
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        // Assume user has payment methods on error to avoid blocking
        setHasPaymentMethods(true);
      }
    };

    if (session?.user?.id) {
      fetchPaymentMethods();
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!garage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cochera no encontrada</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 text-green-600 hover:text-green-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const ownerName = garage.user.firstName && garage.user.lastName
    ? `${garage.user.firstName} ${garage.user.lastName}`
    : garage.user.name || "Propietario";

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleReserve = () => {
    // Check if user has payment methods
    if (hasPaymentMethods === false) {
      setShowPaymentModal(true);
      return;
    }

    setViewMode("reservation");
  };

  const handleReservationBack = () => {
    setViewMode("details");
  };

  const handleReservationSuccess = (reservationId: string) => {
    setCurrentReservationId(reservationId);
    setViewMode("pending");
  };

  const handleReservationConfirmed = (reservation: any) => {
    setCurrentReservation(reservation);
    setViewMode("confirmed");
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
  };

  const handleGoToPaymentMethods = () => {
    setShowPaymentModal(false);
    router.push('/profile/payment-methods');
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[dayOfWeek];
  };

  const getDayShortName = (dayOfWeek: number) => {
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    return days[dayOfWeek];
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove seconds if present
  };

  // Show reservation flow screens
  if (viewMode === "reservation" && garage) {
    return (
      <ReservationForm
        garage={garage}
        onBack={handleReservationBack}
        onSuccess={handleReservationSuccess}
      />
    );
  }

  if (viewMode === "pending" && currentReservationId) {
    return (
      <ReservationPending
        reservationId={currentReservationId}
        onBack={handleReservationBack}
        onConfirmed={handleReservationConfirmed}
      />
    );
  }

  if (viewMode === "confirmed" && currentReservation) {
    return (
      <ReservationConfirmed
        reservation={currentReservation}
        onBack={handleReservationBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-sm bg-white min-h-screen">
        {/* Header */}
        <div className="relative">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-6 z-20 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center"
        >
          <ArrowLeftIcon className="w-6 h-6 text-white" />
        </button>

        {/* Image Carousel */}
        <div className="relative h-40vh bg-gray-200">
          {garage.images.length > 0 ? (
            <>
              <img
                src={garage.images[currentImageIndex]}
                alt="Cochera"
                className="w-full h-full object-cover"
              />

              {/* Image Dots Indicator */}
              {garage.images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
                  {garage.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleImageChange(index)}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Image Counter */}
              {garage.images.length > 1 && (
                <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                  {currentImageIndex + 1}/{garage.images.length}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
              <MapPinIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {/* Title and Rating */}
        <div className="mb-3">
          <h1 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
            {garage.address.length > 50 ? `${garage.address.substring(0, 50)}...` : garage.address}
          </h1>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarSolidIcon
                  key={star}
                  className={`w-4 h-4 ${
                    star <= averageRating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-1 text-sm text-gray-600">
                {averageRating.toFixed(1)} ({reviews.length})
              </span>
            </div>

            {/* Price - More prominent */}
            {garage.hourlyPrice && (
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                ${garage.hourlyPrice}/h
              </span>
            )}
          </div>

          {/* Distance and Type - More compact */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <MapPinIcon className="w-4 h-4 mr-1" />
              <span>A 200m</span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 mr-1 rounded-full ${garage.type === "COVERED" ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
              <span>{garage.type === "COVERED" ? "Cubierta" : "Descubierta"}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Descripción
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {garage.rules || `Cochera ${garage.type === "COVERED" ? "fija y cubierta" : "descubierta"} en edificio residencial. Ideal para auto mediano o camioneta. Acceso con ${garage.accessType === "REMOTE_CONTROL" ? "portón automático" : "llaves"} 24hs. Zona segura y bien iluminada.`}
          </p>
        </div>

        {/* Available Hours */}
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Horarios disponibles
          </h2>

          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            {garage.availabilitySchedules && garage.availabilitySchedules.length > 0 ? (
              garage.availabilitySchedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{getDayName(schedule.dayOfWeek)}</span>
                  <span className="text-sm text-green-600 font-medium">
                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-2">
                No hay horarios disponibles
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Ubicación
          </h2>

          <div className="h-48vh bg-gray-200 rounded-lg overflow-hidden">
            {isMapLoaded ? (
              <MapContainer
                center={[garage.latitude, garage.longitude]}
                zoom={15}
                className="w-full h-full"
                zoomControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[garage.latitude, garage.longitude]} />
              </MapContainer>
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <MapPinIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-gray-900">
              Reseñas
            </h2>
            <button className="text-green-600 text-sm font-medium">
              Ver todas
            </button>
          </div>

          <div className="space-y-3">
            {reviews.slice(0, 2).map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <div className="flex items-center mr-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarSolidIcon
                        key={star}
                        className={`w-3 h-3 ${
                          star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-gray-900 text-sm">{review.userName}</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg safe-area-pb z-50">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-2">
            {garage.hourlyPrice && (
              <div className="text-left">
                <div className="text-sm text-gray-500">Precio por hora</div>
                <div className="text-lg font-bold text-gray-900">${garage.hourlyPrice}</div>
              </div>
            )}
            <div className="text-right">
              <div className="flex items-center text-sm text-gray-600">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarSolidIcon
                    key={star}
                    className={`w-3 h-3 ${
                      star <= averageRating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-1">({reviews.length})</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleReserve}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-green-700 transition-colors active:bg-green-800"
          >
            Reservar ahora
          </button>
        </div>
      </div>
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <>
          <div className="fixed inset-0 bg-black opacity-50 z-40"></div>
          <div className="fixed inset-0 flex items-center justify-center z-500 p-4">
            <div className="bg-white rounded-lg max-w-sm w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <CreditCardIcon className="w-6 h-6 text-red-500 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Método de pago requerido
                    </h3>
                  </div>
                  <button
                    onClick={handleClosePaymentModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Para realizar una reserva, necesitas tener al menos un método de pago registrado en tu cuenta. Esto nos permite procesar el pago de manera segura cuando confirmes tu reserva.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleClosePaymentModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGoToPaymentMethods}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Agregar método
                  </button>
                </div>
              </div>
            </div>
          </div>
      
      </>
      )}
    </div>
  );
}
