"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BottomNavigation from "@/components/ui/BottomNavigation";
import InicioSection from "@/components/dashboard/InicioSection";
import VehiclesSection from "@/components/dashboard/VehiclesSection";
import GaragesSection from "@/components/dashboard/GaragesSection";
import ProfileSection from "@/components/dashboard/ProfileSection";
import ReservationsSection from "@/components/dashboard/ReservationsSection";
import OwnerReservationsSection from "@/components/dashboard/OwnerReservationsSection";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Handle section parameter from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sectionParam = urlParams.get("section");
    if (sectionParam && !activeSection) {
      setActiveSection(sectionParam);
    }
  }, [activeSection]);

    // Initialize active section when session is available
  useEffect(() => {
    if (session?.user?.role && !activeSection) {
      // Ambos roles empiezan en "inicio"
      const defaultSection = "inicio";
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
        return <ReservationsSection />;
      case "solicitudes":
        // Solo permitir acceso a usuarios con rol CONDUCTOR_PROPIETARIO
        if (session?.user?.role !== "CONDUCTOR_PROPIETARIO") {
        return (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Restringido</h2>
                <p className="text-gray-600">Esta sección está disponible solo para usuarios con rol de Propietario</p>
                <p className="text-sm text-gray-500 mt-2">
                  Cambia tu rol desde tu perfil si deseas gestionar cocheras
                </p>
            </div>
          </div>
        );
        }
        return <OwnerReservationsSection />;
      case "garages":
        // Solo permitir acceso a usuarios con rol CONDUCTOR_PROPIETARIO
        if (session?.user?.role !== "CONDUCTOR_PROPIETARIO") {
          return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Restringido</h2>
                <p className="text-gray-600">Esta sección está disponible solo para usuarios con rol de Propietario</p>
                <p className="text-sm text-gray-500 mt-2">
                  Cambia tu rol desde tu perfil si deseas gestionar cocheras
                </p>
              </div>
            </div>
          );
        }
        return <GaragesSection />;
      case "perfil":
        return <ProfileSection />;
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
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="mx-auto w-full max-w-sm md:max-w-2xl lg:max-w-4xl xl:max-w-7xl bg-white min-h-screen flex flex-col md:flex-row relative overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <div className="hidden md:flex md:flex-col md:w-64 lg:w-72 xl:w-80 bg-white border-r border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">ParkMatch</span>
            </div>
          </div>
          <BottomNavigation 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col pb-16 md:pb-0 h-full">
          {renderActiveSection()}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden">
          <BottomNavigation 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
          />
        </div>
      </div>
    </div>
  );
}
