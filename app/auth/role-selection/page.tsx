"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { KeyIcon } from "@heroicons/react/24/outline";

type UserRole = "CONDUCTOR" | "CONDUCTOR_PROPIETARIO";

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status, update } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

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

  const handleRoleSelection = async () => {
    if (!selectedRole || !session?.user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/user/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (response.ok) {
        // Refresh the page to update the session with new role
        router.refresh();
        router.push("/profile/complete");
      } else {
        alert("Error al actualizar el rol");
      }
    } catch (error) {
      alert("Error al actualizar el rol");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-sm md:max-w-md lg:max-w-lg bg-white min-h-screen md:min-h-0 md:my-8 md:rounded-2xl md:shadow-xl">
        <div className="px-6 md:px-8 lg:px-10 pt-12 md:pt-8 lg:pt-10">
          {/* Back Button */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <KeyIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Elegí tu rol principal
            </h1>
            <p className="text-gray-600">
              Podrás cambiarlo más adelante desde tu perfil.
            </p>
          </div>

          {/* Role Options */}
          <div className="space-y-4 mb-8">
            <button
              onClick={() => setSelectedRole("CONDUCTOR")}
              className={`w-full p-4 border-2 rounded-2xl text-left transition-colors ${
                selectedRole === "CONDUCTOR"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Conductor</h3>
                  <p className="text-sm text-gray-600">
                    Buscá y reservá espacios de estacionamiento.
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedRole === "CONDUCTOR"
                    ? "border-green-500 bg-green-500"
                    : "border-gray-300"
                }`}>
                  {selectedRole === "CONDUCTOR" && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole("CONDUCTOR_PROPIETARIO")}
              className={`w-full p-4 border-2 rounded-2xl text-left transition-colors ${
                selectedRole === "CONDUCTOR_PROPIETARIO"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Conductor y Propietario</h3>
                  <p className="text-sm text-gray-600">
                    Además de publicar, buscá y reservá otros espacios.
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedRole === "CONDUCTOR_PROPIETARIO"
                    ? "border-green-500 bg-green-500"
                    : "border-gray-300"
                }`}>
                  {selectedRole === "CONDUCTOR_PROPIETARIO" && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleRoleSelection}
            disabled={!selectedRole || isLoading}
            className="w-full bg-green-500 text-white font-semibold py-4 px-6 rounded-2xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Confirmando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
