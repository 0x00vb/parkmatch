import { z } from "zod";
import { NextResponse } from "next/server";

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const idSchema = z.object({
  id: z.coerce.number().positive("ID debe ser un número positivo"),
});

export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "Archivo demasiado grande (máx 5MB)")
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
      "Tipo de archivo no permitido. Solo imágenes JPEG, PNG o WebP"
    ),
});

// Validation helpers
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') };
    }
    return { success: false, error: 'Error de validación desconocido' };
  }
}

// Environment validation
export function validateEnvironment(vars: string[]): { success: true } | { success: false; missing: string[] } {
  const missing = vars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    return { success: false, missing };
  }

  return { success: true };
}
