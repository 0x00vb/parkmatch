"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { TruckIcon, HomeIcon, MapPinIcon, CurrencyDollarIcon, ClockIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const fullText = "Match";

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayText((prev) => {
        if (!isDeleting) {
          // Typing forward
          const nextText = fullText.slice(0, prev.length + 1);
          if (nextText === fullText) {
            // Finished typing, start deleting after a pause
            setTimeout(() => setIsDeleting(true), 1000);
          }
          return nextText;
        } else {
          // Deleting backward
          const nextText = prev.slice(0, -1);
          if (nextText === "") {
            // Finished deleting, start typing again after a pause
            setTimeout(() => setIsDeleting(false), 500);
          }
          return nextText;
        }
      });
    }, isDeleting ? 100 : 200); // Faster when deleting

    return () => clearTimeout(timer);
  }, [displayText, isDeleting]);

  return (
    <div className="min-h-screen bg-linear-gradient(to bottom, #f0f0f0, #ffffff)">
      {/* Hero Section */}
      <div 
        className="mx-auto  h-screen px-4 sm:px-6 lg:px-8 relative"
        style={{
          backgroundImage: 'url(/LandingHero.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-white/80"></div>
        <div className="relative z-10 pt-12 pb-20 md:pt-20 md:pb-28 text-center">
          {/* Logo and Header */}
          <div className="flex items-center justify-center mb-8">
            <img
              src="/MatchLogo.webp"
              alt="Match Logo"
              className="w-16 h-16 rounded-2xl shadow-lg mr-4"
            />
            <span className="text-3xl md:text-4xl font-bold text-gray-900">
              {displayText}
              <span className="animate-pulse text-green-600">|</span>
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6 max-w-4xl mx-auto">
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              La forma inteligente
            </span> 
            <br />
            de estacionar en Buenos Aires
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Conectamos conductores con propietarios de cocheras para ofrecer una experiencia de estacionamiento segura, conveniente y económica.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/signup"
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-4 px-8 rounded-2xl text-center block hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transform hover:-translate-y-1"
            >
              Comenzar Ahora
            </Link>
            
            <Link
              href="/auth/signin"
              className="bg-white text-gray-700 font-semibold py-4 px-8 rounded-2xl text-center block hover:bg-gray-50 border-2 border-gray-200 transition-colors duration-300 shadow-md"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section
      <div className="bg-white py-12 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">1000+</div>
              <div className="text-gray-600">Cocheras Disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">10k+</div>
              <div className="text-gray-600">Usuarios Activos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">98%</div>
              <div className="text-gray-600">Satisfacción</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-gray-600">Soporte</div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir <span className="text-green-600">Match</span>?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Nuestra plataforma ofrece una solución completa para todos tus necesidades de estacionamiento
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-linear-to-br from-white to-gray-50 rounded-3xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <MapPinIcon className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fácil de Encontrar</h3>
              <p className="text-gray-600">
                Busca y encuentra cocheras disponibles en tiempo real en tu ubicación con nuestra interfaz intuitiva.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-linear-to-br from-white to-gray-50 rounded-3xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <CurrencyDollarIcon className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Precio Justo</h3>
              <p className="text-gray-600">
                Encuentra las mejores ofertas de estacionamiento con precios competitivos y transparentes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-linear-to-br from-white to-gray-50 rounded-3xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <ClockIcon className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Reserva Instantánea</h3>
              <p className="text-gray-600">
                Reserva tu cochera con solo unos pocos clics y asegura tu lugar antes de llegar.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-linear-to-br from-white to-gray-50 rounded-3xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheckIcon className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Seguridad Garantizada</h3>
              <p className="text-gray-600">
                Todas nuestras cocheras están verificadas y aseguradas para tu tranquilidad.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Value Proposition Section */}
      <div className="py-20 bg-linear-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Solución dual para <span className="text-green-600">Conductores</span> y <span className="text-green-600">Propietarios</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Match conecta a conductores con cocheras disponibles y permite a los propietarios monetizar sus espacios de estacionamiento.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                    <TruckIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Para Conductores</h3>
                    <p className="text-gray-600">
                      Encuentra lugares seguros, reserva en tiempo real y ahorra tiempo. 
                      Accede a cocheras en zonas estratégicas de Buenos Aires con precios transparentes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                    <HomeIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Para Propietarios</h3>
                    <p className="text-gray-600">
                      Gana dinero extra alquilando tus cocheras disponibles. 
                      Tienes control total sobre horarios, precios y disponibilidad.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative hidden sm:block ">
              <div className="bg-white rounded-3xl p-3 shadow-xl border border-gray-200">
                <div className="rounded-sm h-80 overflow-hidden relative p-2">
                  <img
                    src="/LandingDemo.webp"
                    alt="Match Demo"
                    className="w-full h-full object-fill rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Listo para cambiar la forma en que estacionas?
          </h2>
          <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
            Únete a miles de usuarios que ya están disfrutando de la comodidad de Match.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-white text-green-600 font-bold py-4 px-8 rounded-2xl text-center block hover:bg-gray-50 transition-colors shadow-lg"
            >
              Comenzar Gratis
            </Link>
            <Link
              href="/dashboard"
              className="bg-transparent border-2 border-white text-white font-bold py-4 px-8 rounded-2xl text-center block hover:bg-white/10 transition-colors"
            >
              Explorar Plataforma
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <img
                src="/MatchLogo.webp"
                alt="Match"
                className="h-12 w-auto"
              />
              <div>
                <span className="text-white text-2xl font-bold ml-2">
                  Match
                </span>
              </div>
            </div>
            <div className="flex space-x-8">
              <Link href="/auth/signin" className="text-gray-300 hover:text-white transition-colors">
                Iniciar Sesión
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                Contacto
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                Términos
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2025 Match. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
