import { useState, useEffect, useCallback, useRef } from 'react';

export interface GeolocationPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
  userFriendlyMessage: string;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchTimeout?: number; // Tiempo máximo para esperar por watchPosition
  fallbackDelay?: number; // Delay antes de intentar fallback con getCurrentPosition
}

export interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: GeolocationError | null;
  isLoading: boolean;
  isWatching: boolean;
  requestLocation: () => void;
  stopWatching: () => void;
  clearError: () => void;
}

const DEFAULT_OPTIONS: Required<GeolocationOptions> = {
  enableHighAccuracy: true,
  timeout: 25000,
  maximumAge: 10000,
  watchTimeout: 20000,
  fallbackDelay: 15000,
};

export const useGeolocation = (options: GeolocationOptions = {}): UseGeolocationReturn => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWatching, setIsWatching] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const watchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const opts = { ...DEFAULT_OPTIONS, ...options };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }

    if (watchTimeoutRef.current) {
      clearTimeout(watchTimeoutRef.current);
      watchTimeoutRef.current = null;
    }

    setIsWatching(false);
    setIsLoading(false);
  }, []);

  const handlePositionSuccess = useCallback((pos: globalThis.GeolocationPosition) => {
    const newPosition: GeolocationPosition = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp,
    };

    console.log('Ubicación obtenida:', {
      lat: newPosition.lat,
      lng: newPosition.lng,
      accuracy: newPosition.accuracy,
      timestamp: new Date(newPosition.timestamp).toLocaleTimeString()
    });

    setPosition(newPosition);
    setError(null);
    setIsLoading(false);
  }, []);

  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    console.error('Error de geolocalización:', err);

    let userFriendlyMessage = "No se pudo obtener tu ubicación.";
    switch (err.code) {
      case err.PERMISSION_DENIED:
        userFriendlyMessage = "Permiso de ubicación denegado. Por favor, permite el acceso a la ubicación en tu navegador.";
        break;
      case err.POSITION_UNAVAILABLE:
        userFriendlyMessage = "Ubicación no disponible. Verifica tu conexión GPS y configuración de ubicación.";
        break;
      case err.TIMEOUT:
        userFriendlyMessage = "Tiempo de espera agotado. Intenta nuevamente en un área con mejor señal GPS.";
        break;
    }

    setError({
      code: err.code,
      message: err.message,
      userFriendlyMessage,
    });
    setIsLoading(false);
    setIsWatching(false);
  }, []);

  const requestLocation = useCallback(() => {
    // Verificar si la geolocalización está disponible
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError({
        code: -1,
        message: "Geolocalización no soportada",
        userFriendlyMessage: "Tu navegador no soporta geolocalización.",
      });
      return;
    }

    // Limpiar estado anterior
    stopWatching();
    setError(null);
    setIsLoading(true);

    console.log('Iniciando obtención de ubicación con configuración:', opts);

    // Usar watchPosition para obtener actualizaciones continuas
    const watchId = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: opts.enableHighAccuracy,
        timeout: opts.timeout,
        maximumAge: opts.maximumAge,
      }
    );

    watchIdRef.current = watchId;
    setIsWatching(true);

    // Timeout para watchPosition - si no obtenemos una buena posición en watchTimeout ms,
    // intentar con getCurrentPosition como fallback
    watchTimeoutRef.current = setTimeout(() => {
      if (isLoading && watchIdRef.current !== null) {
        console.log('WatchPosition tardando demasiado, intentando fallback con getCurrentPosition...');

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            // Limpiar el watcher ya que obtuvimos una posición con getCurrentPosition
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
            }
            handlePositionSuccess(pos);
            setIsWatching(false);
          },
          handlePositionError,
          {
            enableHighAccuracy: true,
            timeout: opts.fallbackDelay,
            maximumAge: 0, // Forzar ubicación fresca
          }
        );
      }
    }, opts.watchTimeout);

  }, [opts, handlePositionSuccess, handlePositionError, stopWatching, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    position,
    error,
    isLoading,
    isWatching,
    requestLocation,
    stopWatching,
    clearError,
  };
};
