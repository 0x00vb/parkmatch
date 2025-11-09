"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PhotoIcon, XMarkIcon, CameraIcon } from "@heroicons/react/24/outline";
import ProgressBar from "@/components/ui/ProgressBar";
import { useSession } from "next-auth/react";

interface UploadedImage {
  id: string;
  url: string;
  publicId: string;
}

export default function GaragePhotosPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Verificar que el usuario tenga rol de propietario
  useEffect(() => {
    if (session?.user?.role === "CONDUCTOR") {
      router.push("/dashboard");
    }
  }, [session?.user?.role, router]);

  useEffect(() => {
    // Check if we have previous step data
    const locationData = sessionStorage.getItem("garageLocation");
    const detailsData = sessionStorage.getItem("garageDetails");
    if (!locationData || !detailsData) {
      router.push("/setup/garage");
    }

    // Get next step info
    const nextStepData = sessionStorage.getItem("garageNextStep");
    setNextStep(nextStepData);
  }, [router]);

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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || images.length >= 3) return;

    const remainingSlots = 3 - images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    setIsUploading(true);
    try {
      for (const file of filesToUpload) {
        await uploadImage(file);
      }
    } catch (error) {
      alert("Error al subir las imágenes");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload/image", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      const newImage: UploadedImage = {
        id: Date.now().toString(),
        url: data.secure_url,
        publicId: data.public_id,
      };
      setImages(prev => [...prev, newImage]);
    } else {
      throw new Error("Failed to upload image");
    }
  };

  const removeImage = async (imageToRemove: UploadedImage) => {
    try {
      // Delete from Cloudinary
      await fetch("/api/upload/image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: imageToRemove.publicId }),
      });

      // Remove from state
      setImages(prev => prev.filter(img => img.id !== imageToRemove.id));
    } catch (error) {
      console.error("Error removing image:", error);
    }
  };

  const handleContinue = async () => {
    if (images.length === 0) {
      alert("Por favor subí al menos una foto de tu espacio");
      return;
    }

    setIsLoading(true);
    try {
      // Get data from previous steps
      const locationData = JSON.parse(sessionStorage.getItem("garageLocation") || "{}");
      const detailsData = JSON.parse(sessionStorage.getItem("garageDetails") || "{}");

      // Create garage
      const garageData = {
        ...locationData,
        ...detailsData,
        images: images.map(img => img.url),
      };

      const response = await fetch("/api/garages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(garageData),
      });

      if (response.ok) {
        // Check if coming from dashboard
        const garageSource = sessionStorage.getItem("garageSource");
        
        // Check next step before clearing session storage
        const shouldContinueToVehicles = nextStep === "vehicles";

        // Clear session storage
        sessionStorage.removeItem("garageLocation");
        sessionStorage.removeItem("garageDetails");
        sessionStorage.removeItem("garageNextStep");
        sessionStorage.removeItem("garageSource");

        if (garageSource === "dashboard") {
          // Return to dashboard garages section
          router.push("/dashboard?section=garages");
        } else if (shouldContinueToVehicles) {
          // Continue to vehicles setup
          router.push("/setup/vehicles?from=garage");
        } else {
          // Go directly to registration completion (skip success screen)
          router.push("/setup/complete");
        }
      } else {
        alert("Error al crear la cochera");
      }
    } catch (error) {
      alert("Error al crear la cochera");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (nextStep === "vehicles") {
      // Skip garage setup and go to vehicles
      router.push("/setup/vehicles?from=garage");
    } else {
      // Skip garage setup and go to completion
      router.push("/setup/complete");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-sm bg-white min-h-screen">
        <div className="px-6 pt-8">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-medium text-gray-900 mb-4">Publicar un espacio</h1>
            <ProgressBar currentStep={2} totalSteps={4} className="mb-6" />
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Mostrá tu estacionamiento
            </h2>
            <p className="text-gray-600 text-sm">
              Subí fotos de alta calidad. Mostrá la entrada, el espacio y cualquier característica de seguridad.
            </p>
          </div>

          {/* Upload Area */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {images.length === 0 ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CameraIcon className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-1">Subir fotos</p>
                <p className="text-sm text-gray-600">o arrastrá las aquí</p>
              </button>
            ) : (
              <div className="space-y-4">
                {/* Image Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {images.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                        <img
                          src={image.url}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          Portada
                        </div>
                      )}
                      <button
                        onClick={() => removeImage(image)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Add More Button */}
                  {images.length < 3 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-50"
                    >
                      <PhotoIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {isUploading ? "Subiendo..." : "Añadir"}
                      </span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-500 text-center">
                  {images.length}/3 fotos • La primera foto será la portada
                </p>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">Consejos para mejores fotos:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Mostrá la entrada y el acceso al espacio</li>
              <li>• Incluí fotos del espacio desde diferentes ángulos</li>
              <li>• Destacá características de seguridad si las hay</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContinue}
              disabled={images.length === 0 || isLoading || isUploading}
              className="w-full bg-green-500 text-white font-semibold py-4 px-6 rounded-2xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creando cochera..." : "Siguiente"}
            </button>
            
            {/* Skip Button - only show if part of conductor y propietario flow */}
            {nextStep && (
              <button
                onClick={handleSkip}
                disabled={isLoading || isUploading}
                className="w-full border border-gray-300 text-gray-700 font-medium py-4 px-6 rounded-2xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Omitir por ahora
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
