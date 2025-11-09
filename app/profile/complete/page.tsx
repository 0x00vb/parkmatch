"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EnvelopeIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import ProgressBar from "@/components/ui/ProgressBar";

const profileSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function CompleteProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
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

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
  });

  const watchedFields = watch();
  const allFieldsFilled = watchedFields.firstName && watchedFields.lastName && watchedFields.phone;

  const onSubmit = async (data: ProfileForm) => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        }),
      });

      if (response.ok) {
        // Update session with new profile data
        await update({
          name: `${data.firstName} ${data.lastName}`,
        });

        // Redirect based on user role
        if (session.user.role === "CONDUCTOR") {
          // Conductor y Propietario: primero cochera, luego vehículos
          router.push("/setup/garage?next=vehicles");
        } else {
          // Solo Propietario: solo cochera
          router.push("/setup/garage");
        }
      } else {
        alert("Error al actualizar el perfil");
      }
    } catch (error) {
      alert("Error al actualizar el perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerification = () => {
    setEmailVerificationSent(true);
    // TODO: Implement actual email verification
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-sm bg-white min-h-screen">
        <div className="px-6 pt-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-lg font-medium text-gray-900 mb-4">Datos personales</h1>
            <ProgressBar currentStep={1} totalSteps={3} className="mb-6" />
          </div>

          {/* Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Completá tus datos
            </h2>
            <p className="text-gray-600 text-sm">
              Necesitamos algunos datos para crear tu perfil de propietario.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                {...register("firstName")}
                type="text"
                id="firstName"
                placeholder="Tu nombre"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Apellido
              </label>
              <input
                {...register("lastName")}
                type="text"
                id="lastName"
                placeholder="Tu apellido"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                {...register("phone")}
                type="tel"
                id="phone"
                placeholder="Ej: 11 2345 6789"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Email Verification */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Verificá tu email</p>
                    <p className="text-sm text-gray-600">
                      Te enviaremos un código para confirmar tu dirección de correo electrónico.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={emailVerificationSent}
                  className="text-green-600 font-medium text-sm hover:text-green-700 disabled:text-gray-400"
                >
                  {emailVerificationSent ? "ENVIADO" : "ENVIAR"}
                </button>
              </div>
            </div>

            {/* Two Factor Authentication */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Autenticación de dos factores</p>
                  <p className="text-sm text-gray-600">
                    Añadí una capa extra de seguridad a tu cuenta.{" "}
                    <span className="text-green-600">(Recomendado)</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!allFieldsFilled || isLoading}
              className="w-full bg-green-500 text-white font-semibold py-4 px-6 rounded-2xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              {isLoading ? "Guardando..." : "Guardar y continuar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
