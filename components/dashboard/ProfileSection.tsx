"use client";

import { useSession, signOut } from "next-auth/react";
import {
  UserIcon,
  CreditCardIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  StarIcon
} from "@heroicons/react/24/outline";

export default function ProfileSection() {
  const { data: session } = useSession();

  // Get real user data
  const userName = session?.user?.name || "Usuario";

  const userRole = session?.user?.role === "CONDUCTOR_PROPIETARIO"
    ? "Conductor y Propietario"
    : "Conductor";

  const handleLogout = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900 text-center">Mi Perfil</h1>
      </div>

      {/* Profile Section */}
      <div className="bg-white mx-4 mt-4 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="w-20 h-20 bg-orange-200 rounded-full flex items-center justify-center mb-4">
            <UserIcon className="w-10 h-10 text-orange-600" />
          </div>

          {/* Name */}
          <h2 className="text-xl font-bold text-gray-900 mb-2">{userName}</h2>

          {/* Rating */}
          <div className="flex items-center text-green-600">
            <span className="text-sm font-medium">4.8</span>
            <StarIcon className="w-4 h-4 ml-1 fill-current" />
            <span className="text-sm font-medium ml-1">{userRole}</span>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="bg-white mx-4 mt-4 rounded-xl shadow-sm">
        <div className="p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Cuenta</h3>

          {/* Información Personal */}
          <button className="w-full flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors mb-1">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <UserIcon className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-base text-gray-900">Información Personal</span>
          </button>

          {/* Métodos de Pago */}
          <button className="w-full flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors mb-1">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <CreditCardIcon className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-base text-gray-900">Métodos de Pago</span>
          </button>

        </div>
      </div>

      {/* Support Section */}
      <div className="bg-white mx-4 mt-4 rounded-xl shadow-sm">
        <div className="p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Soporte</h3>

          <button className="w-full flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <QuestionMarkCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-base text-gray-900">Ayuda y Soporte</span>
          </button>
        </div>
      </div>

      {/* Logout Button */}
      <div className="mx-4 mt-6 mb-8">
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-center hover:bg-red-100 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-600 mr-3" />
          <span className="text-base font-medium text-red-600">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
