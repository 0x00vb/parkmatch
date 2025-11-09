"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { debounce } from "lodash";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface DebouncedInputProps {
  value: string;
  onChange: (value: string) => void;
  onDebouncedChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  icon?: React.ReactNode;
  showClearButton?: boolean;
  "aria-label"?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Componente de input debounced optimizado para búsquedas
 * Características:
 * - Debounce configurable para evitar llamadas excesivas
 * - Control manual del estado interno para mejor UX
 * - Limpieza automática de timeout en unmount
 * - Soporte para iconos personalizados
 * - Botón de limpiar opcional
 * - Validación de longitud máxima
 * - Accesibilidad con ARIA labels
 */
export default function DebouncedInput({
  value,
  onChange,
  onDebouncedChange,
  placeholder = "Buscar...",
  debounceMs = 300,
  className = "",
  disabled = false,
  maxLength,
  autoFocus = false,
  icon,
  showClearButton = true,
  "aria-label": ariaLabel,
  onKeyDown,
}: DebouncedInputProps) {
  const [internalValue, setInternalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Crear función debounced con useCallback para estabilidad
  const debouncedOnChange = useCallback(
    debounce((newValue: string) => onDebouncedChange(newValue), debounceMs),
    [onDebouncedChange, debounceMs]
  );

  // Sincronizar valor interno cuando cambia el prop value
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Limpiar debounce en unmount
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange(newValue); // Cambio inmediato para UI responsiva
    debouncedOnChange(newValue); // Cambio debounced para lógica costosa
  };

  const handleClear = () => {
    setInternalValue("");
    onChange("");
    debouncedOnChange("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      handleClear();
    }
  };

  const defaultIcon = icon || <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />;

  return (
    <div className="relative">
      {/* Icono de búsqueda */}
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
        {defaultIcon}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={internalValue}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          // Ejecutar handleKeyDown interno primero (para Escape)
          if (e.key === "Escape") {
            handleClear();
          }
          // Luego ejecutar el onKeyDown del padre
          onKeyDown?.(e);
        }}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        autoFocus={autoFocus}
        aria-label={ariaLabel || placeholder}
        className={`
          w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-green-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          transition-colors duration-200
          ${className}
        `}
      />

      {/* Botón de limpiar */}
      {showClearButton && internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2
                     p-1 rounded-full hover:bg-gray-100 transition-colors
                     focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label="Limpiar búsqueda"
        >
          <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );
}

// Hook personalizado para usar DebouncedInput con estado local
export function useDebouncedInput(initialValue = "", debounceMs = 300) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  const handleDebouncedChange = useCallback(
    debounce((newValue: string) => setDebouncedValue(newValue), debounceMs),
    [debounceMs]
  );

  // Limpiar debounce en unmount
  useEffect(() => {
    return () => {
      handleDebouncedChange.cancel();
    };
  }, [handleDebouncedChange]);

  return {
    value,
    debouncedValue,
    setValue,
    handleChange,
    handleDebouncedChange,
  };
}
