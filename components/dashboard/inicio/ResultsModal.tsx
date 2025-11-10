"use client";

import { MapPinIcon } from "@heroicons/react/24/outline";
import ResultsHeader from "@/components/ui/ResultsHeader";

interface ParkingSpot {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  type: "COVERED" | "UNCOVERED";
  price?: number;
  available: boolean;
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
  createdAt: string;
  user: {
    name?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface ModalResult {
  garage?: Garage;
  parkingSpot?: ParkingSpot;
  distance: number;
}

interface ResultsModalProps {
  showModal: boolean;
  results: ModalResult[];
  onClose: () => void;
  onGarageClick: (garageId: string) => void;
  onParkingSpotClick: (latitude: number, longitude: number) => void;
}

export default function ResultsModal({
  showModal,
  results,
  onClose,
  onGarageClick,
  onParkingSpotClick
}: ResultsModalProps) {
  if (!showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="w-full max-w-sm md:max-w-2xl lg:max-w-3xl bg-white rounded-t-2xl md:rounded-2xl max-h-1/2 md:max-h-3/4 mb-18 md:mb-0 overflow-hidden shadow-xl transform transition-transform duration-300 ease-out">
        {/* Modal Header */}
        <ResultsHeader title="Cocheras cercanas" onClose={onClose} />

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto max-h-96 md:max-h-[500px] lg:max-h-[600px]">
          {results.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {results.map((result, index) => {
                const item = result.garage || result.parkingSpot!;
                const isGarage = !!result.garage;

                return (
                  <div
                    key={`${isGarage ? 'garage' : 'spot'}-${item.id}`}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      if (isGarage) {
                        onGarageClick(item.id);
                      } else {
                        onParkingSpotClick(item.latitude, item.longitude);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0">
                        {isGarage ? (
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <div className="w-6 h-6 bg-blue-500 rounded"></div>
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            (item as ParkingSpot).available
                              ? (item as ParkingSpot).type === "COVERED"
                                ? "bg-green-100"
                                : "bg-orange-100"
                              : "bg-red-100"
                          }`}>
                            <div className={`w-6 h-6 rounded ${
                              (item as ParkingSpot).available
                                ? (item as ParkingSpot).type === "COVERED"
                                  ? "bg-green-500"
                                  : "bg-orange-500"
                                : "bg-red-500"
                            }`}></div>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {item.address}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {result.distance < 1
                                  ? `${(result.distance * 1000).toFixed(0)}m`
                                  : `${result.distance.toFixed(1)}km`
                                }
                              </span>
                              {isGarage ? (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  Cochera
                                </span>
                              ) : (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  (item as ParkingSpot).available
                                    ? (item as ParkingSpot).type === "COVERED"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-orange-100 text-orange-800"
                                    : "bg-red-100 text-red-800"
                                }`}>
                                  {(item as ParkingSpot).available ? "Disponible" : "Ocupado"}
                                </span>
                              )}
                            </div>
                          </div>

                          {isGarage && result.garage?.hourlyPrice && (
                            <div className="shrink-0 ml-2">
                              <span className="text-sm font-semibold text-green-600">
                                ${result.garage.hourlyPrice}/h
                              </span>
                            </div>
                          )}
                        </div>

                        {isGarage && result.garage && (
                          <div className="flex items-center gap-2 mt-2">
                            {result.garage.hasGate && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                Portón
                              </span>
                            )}
                            {result.garage.hasCameras && (
                              <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                                Cámaras
                              </span>
                            )}
                            <span className="text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
                              {result.garage.accessType === "REMOTE_CONTROL" ? "Control remoto" : "Llaves"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <MapPinIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay cocheras cerca de esta ubicación
              </h3>
              <p className="text-sm text-gray-500">
                Intenta buscar en otra ubicación o amplía tu búsqueda
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
