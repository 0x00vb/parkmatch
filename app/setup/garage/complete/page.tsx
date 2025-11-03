"use client";

import { useRouter } from "next/navigation";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

export default function GarageCompleteePage() {
  const router = useRouter();

  const handleContinue = () => {
    // Redirect to main dashboard (not implemented yet)
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500">
      <div className="mx-auto max-w-sm bg-white min-h-screen flex items-center justify-center">
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
