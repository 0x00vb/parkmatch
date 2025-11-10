"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

export default function GarageCompleteePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

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

  const handleContinue = () => {
    // Check if this is a conductor y propietario who should continue to vehicles
    if (session?.user?.role === "CONDUCTOR") {
      // Check if they came from the setup flow and should continue to vehicles
      const urlParams = new URLSearchParams(window.location.search);
      const shouldContinueToVehicles = urlParams.get('next') === 'vehicles';

      if (shouldContinueToVehicles) {
        router.push("/setup/vehicles?from=garage");
        return;
      }
    }

    // Default: redirect to main dashboard
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500">
      <div className="mx-auto max-w-sm md:max-w-md lg:max-w-lg bg-white min-h-screen md:min-h-0 md:my-8 md:rounded-2xl md:shadow-xl flex items-center justify-center">
        <div className="px-6 text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircleIcon className="w-16 h-16 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Cochera publicada!
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Tu espacio de estacionamiento ha sido publicado exitosamente. 
              Los conductores ya pueden encontrarlo y reservarlo.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleContinue}
            className="w-full bg-green-500 text-white font-semibold py-4 px-6 rounded-2xl hover:bg-green-600 transition-colors text-lg"
          >
            Ver mi cochera
          </button>
        </div>
      </div>
    </div>
  );
}
