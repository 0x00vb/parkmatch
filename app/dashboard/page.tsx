"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-sm bg-white min-h-screen">
        <div className="px-6 pt-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Bienvenido a ParkMatch!
            </h1>
            <p className="text-gray-600 mb-4">
              Hola {session.user.name || session.user.email}
            </p>
            <p className="text-sm text-gray-500">
              Rol: {session.user.role === "CONDUCTOR" ? "Conductor" : "Conductor y Propietario"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
