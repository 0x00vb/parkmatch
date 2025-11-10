"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return "Hay un problema con la configuración del servidor.";
      case "AccessDenied":
        return "No tienes permisos para acceder a este recurso.";
      case "Verification":
        return "El enlace de verificación ha expirado o ya ha sido utilizado.";
      case "Default":
        return "Ha ocurrido un error durante la autenticación.";
      case "CredentialsSignin":
        return "Las credenciales proporcionadas son incorrectas.";
      case "EmailSignin":
        return "No se pudo enviar el email de verificación.";
      case "OAuthSignin":
        return "Error al iniciar sesión con el proveedor externo.";
      case "OAuthCallback":
        return "Error en el callback del proveedor externo.";
      case "OAuthCreateAccount":
        return "No se pudo crear la cuenta con el proveedor externo.";
      case "EmailCreateAccount":
        return "No se pudo crear la cuenta con el email proporcionado.";
      case "Callback":
        return "Error en el callback de autenticación.";
      case "OAuthAccountNotLinked":
        return "Para confirmar tu identidad, inicia sesión con la misma cuenta que usaste originalmente.";
      case "SessionRequired":
        return "Debes iniciar sesión para acceder a esta página.";
      default:
        return "Ha ocurrido un error inesperado. Por favor, intenta de nuevo.";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="mx-auto max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Error de Autenticación
          </h1>

          {/* Error Message */}
          <p className="text-gray-600 mb-6">
            {getErrorMessage(error)}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Volver al Inicio de Sesión
            </Link>

            <Link
              href="/"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Ir al Inicio
            </Link>
          </div>

          {/* Debug Info (only in development) */}
          {process.env.NODE_ENV === "development" && error && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md">
              <p className="text-xs text-gray-600">
                <strong>Error Code:</strong> {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
