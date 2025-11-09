"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BottomNavigation from "@/components/ui/BottomNavigation";
import InicioSection from "@/components/dashboard/InicioSection";
import VehiclesSection from "@/components/dashboard/VehiclesSection";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

    // Initialize active section when session is available
  useEffect(() => {
    if (session?.user?.role && !activeSection) {
      const defaultSection = session.user.role === "CONDUCTOR" ? "inicio" : "reservas";
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setActiveSection(defaultSection);
    }
  }, [session?.user?.role, activeSection]);

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

  const renderActiveSection = () => {
    switch (activeSection) {
      case "inicio":
        return <InicioSection />;
      case "vehiculos":
        return <VehiclesSection />;
      case "reservas":
        return (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Reservas</h2>
              <p className="text-gray-600">Sección en desarrollo</p>
            </div>
          </div>
        );
      case "garages":
        return (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Mis Garages</h2>
              <p className="text-gray-600">Sección en desarrollo</p>
            </div>
          </div>
        );
      case "perfil":
        return (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Perfil</h2>
              <p className="text-gray-600">Sección en desarrollo</p>
              <div className="mt-4 text-sm text-gray-500">
                <p>Usuario: {session.user.name || session.user.email}</p>
                <p>Rol: {session.user.role === "CONDUCTOR" ? "Conductor" : "Conductor y Propietario"}</p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Bienvenido a ParkMatch!</h2>
              <p className="text-gray-600">Selecciona una sección para comenzar</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="mx-auto w-full max-w-sm bg-white min-h-screen flex flex-col relative">
        {/* Main Content */}
        <div className="flex-1 flex flex-col pb-16">
          {renderActiveSection()}
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
      </div>
    </div>
  );
}
