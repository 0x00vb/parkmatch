"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  CreditCardIcon,
  StarIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

type PaymentMethod = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  holderName?: string | null;
  network?: string | null;
  default: boolean;
  createdAt: string;
};

const cardFormSchema = z.object({
  holderName: z.string().min(2, "Nombre inválido"),
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => /^\d{13,19}$/.test(v), { message: "Número inválido" }),
  expMonth: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v >= 1 && v <= 12, {
      message: "Mes inválido",
    }),
  expYear: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v >= new Date().getFullYear(), {
      message: "Año inválido",
    }),
  cvc: z
    .string()
    .transform((v) => v.trim())
    .refine((v) => /^\d{3,4}$/.test(v), { message: "CVC inválido" }),
  makeDefault: z.boolean().optional(),
});

type CardForm = z.infer<typeof cardFormSchema>;

function detectBrand(cardNumber: string): { brand: string; network: string } {
  const n = cardNumber.replace(/\s+/g, "");
  if (/^4\d{12,18}$/.test(n)) return { brand: "Visa", network: "visa" };
  if (/^(5[1-5]\d{14}|2(2[2-9]\d{12}|[3-6]\d{13}|7[01]\d{12}|720\d{12}))$/.test(n))
    return { brand: "Mastercard", network: "mastercard" };
  if (/^3[47]\d{13}$/.test(n)) return { brand: "American Express", network: "amex" };
  if (/^6(?:011|5\d{2})\d{12}$/.test(n)) return { brand: "Discover", network: "discover" };
  return { brand: "Tarjeta", network: "card" };
}

function formatCardNumber(v: string): string {
  const digits = v.replace(/\D/g, "");
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export default function PaymentMethodsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset,
  } = useForm<CardForm>({
    resolver: zodResolver(cardFormSchema),
    mode: "onChange",
    defaultValues: {
      holderName: "",
      cardNumber: "",
      expMonth: "",
      expYear: "",
      cvc: "",
      makeDefault: true,
    } as unknown as CardForm,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const cardNumberValue = watch("cardNumber") as unknown as string;
  useEffect(() => {
    // live format card number
    setValue("cardNumber" as any, formatCardNumber(cardNumberValue || ""), { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMethods() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payment-methods", { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "No se pudo cargar");
      }
      const data = await res.json();
      setMethods(data.methods || []);
    } catch (e: any) {
      setError(e.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMethods();
  }, []);

  async function onSubmit(form: CardForm) {
    try {
      const num = (form.cardNumber as unknown as string).replace(/\s+/g, "");
      const meta = detectBrand(num);
      const payload = {
        brand: meta.brand,
        last4: num.slice(-4),
        expMonth: Number(form.expMonth as unknown as string),
        expYear: Number(form.expYear as unknown as string),
        holderName: form.holderName,
        network: meta.network,
        default: !!form.makeDefault,
      };
      const res = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "No se pudo guardar");
      }
      reset();
      setShowAddForm(false);
      await loadMethods();
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    }
  }

  async function removeMethod(id: string) {
    try {
      const res = await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "No se pudo eliminar");
      }
      await loadMethods();
    } catch (e: any) {
      setError(e.message || "Error al eliminar");
    }
  }

  async function setDefault(id: string) {
    try {
      const res = await fetch(`/api/payment-methods/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "No se pudo establecer como predeterminado");
      }
      await loadMethods();
    } catch (e: any) {
      setError(e.message || "Error al actualizar");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b border-gray-200 flex items-center">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors mr-2"
          aria-label="Volver"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center mr-6">
          Medios de Pago
        </h1>
      </div>

      {/* List */}
      <div className="mx-4 mt-4">
        {loading ? (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-600">
            Cargando...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        ) : methods.length === 0 ? (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCardIcon className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-gray-900 font-medium">No tienes tarjetas cargadas</p>
            <p className="text-gray-600 text-sm mt-1">
              Agrega una tarjeta para realizar pagos de tus reservas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <CreditCardIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">
                      {m.brand} •••• {m.last4}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Vence {String(m.expMonth).padStart(2, "0")}/{m.expYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {m.default ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 flex items-center">
                      <StarIcon className="w-4 h-4 mr-1" />
                      Predeterminada
                    </span>
                  ) : (
                    <button
                      onClick={() => setDefault(m.id)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Marcar como predeterminada
                    </button>
                  )}
                  <button
                    onClick={() => removeMethod(m.id)}
                    className="p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors"
                    aria-label="Eliminar tarjeta"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Card */}
      <div className="mx-4 my-6">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-green-600 text-white rounded-xl p-4 flex items-center justify-center hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 text-white mr-2" />
            Agregar tarjeta
          </button>
        ) : (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Nueva tarjeta</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre en la tarjeta
                </label>
                <input
                  type="text"
                  {...register("holderName")}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Ej: Juan Pérez"
                />
                {errors.holderName && (
                  <p className="text-sm text-red-600 mt-1">{errors.holderName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de tarjeta
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  {...register("cardNumber")}
                  onChange={(e) => {
                    const formatted = formatCardNumber(e.target.value);
                    e.target.value = formatted;
                  }}
                  className="w-full border border-gray-300 rounded-lg p-3 tracking-widest focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="1234 5678 9012 3456"
                />
                {errors.cardNumber && (
                  <p className="text-sm text-red-600 mt-1">{errors.cardNumber.message}</p>
                )}
              </div>
              <div className="flex space-x-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mes
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    {...register("expMonth")}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="MM"
                  />
                  {errors.expMonth && (
                    <p className="text-sm text-red-600 mt-1">{errors.expMonth.message as string}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    {...register("expYear")}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="AAAA"
                  />
                  {errors.expYear && (
                    <p className="text-sm text-red-600 mt-1">{errors.expYear.message as string}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVC
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    {...register("cvc")}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="CVC"
                  />
                  {errors.cvc && (
                    <p className="text-sm text-red-600 mt-1">{errors.cvc.message}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <input
                  id="makeDefault"
                  type="checkbox"
                  {...register("makeDefault")}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded"
                  defaultChecked
                />
                <label htmlFor="makeDefault" className="ml-2 text-sm text-gray-700">
                  Establecer como predeterminada
                </label>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    reset();
                  }}
                  className="flex-1 bg-gray-100 text-gray-800 rounded-xl p-3 font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isValid}
                  className="flex-1 bg-green-600 text-white rounded-xl p-3 font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Guardar tarjeta
                </button>
              </div>
              <p className="text-xs text-gray-500 pt-1">
                Por seguridad no almacenamos el número completo ni el CVC.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}


