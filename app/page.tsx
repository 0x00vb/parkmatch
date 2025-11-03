"use client";

import Link from "next/link";
import { TruckIcon, HomeIcon } from "@heroicons/react/24/outline";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-sm bg-white min-h-screen">
        {/* Header */}
        <div className="px-6 pt-12 pb-8">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">ParkMatch</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-6">
            La forma inteligente de estacionar en Buenos Aires.
          </h1>
          
          {/* Street Image */}
          <div className="w-full h-40 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl mb-8 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-b from-transparent to-black/20 flex items-end justify-center p-4">
              <div className="text-center">
                <div className="w-full h-32 bg-gradient-to-r from-amber-300 to-orange-300 rounded-lg mb-2 relative">
                  {/* Simple street illustration */}
                  <div className="absolute inset-0 bg-gradient-to-b from-yellow-200/50 to-orange-400/30 rounded-lg"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gray-600/20 rounded-b-lg"></div>
                  <div className="absolute bottom-2 left-4 right-4 h-1 bg-yellow-300/60 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="px-6 space-y-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <TruckIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Para Conductores</h3>
                <p className="text-sm text-gray-600">
                  Encuentra lugares seguros, reserva y ahorra tiempo.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <HomeIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Para Propietarios</h3>
                <p className="text-sm text-gray-600">
                  Gana dinero extra, controla el horario y publica de forma segura.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="px-6 pb-8">
          <Link
            href="/auth/signup"
            className="w-full bg-green-500 text-white font-semibold py-4 px-6 rounded-2xl text-center block hover:bg-green-600 transition-colors"
          >
            Comenzar Ahora
          </Link>
          
          <div className="text-center mt-4">
            <span className="text-sm text-gray-600">¿Ya tienes cuenta? </span>
            <Link href="/auth/signin" className="text-sm text-green-600 font-medium">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
