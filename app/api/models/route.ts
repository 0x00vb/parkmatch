import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling, logInfo, API_ERRORS } from "@/lib/errors";
import { validateData, idSchema } from "@/lib/validation";
import { hybridCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";

async function getModels(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const makeId = searchParams.get("make_id");

  if (!makeId) {
    throw API_ERRORS.VALIDATION_ERROR("make_id es requerido");
  }

  const validation = validateData(idSchema, { id: makeId });
  if (!validation.success) {
    throw API_ERRORS.VALIDATION_ERROR(validation.error);
  }

  logInfo("Fetching vehicle models", { makeId: validation.data.id });

  const models = await hybridCache(
    CACHE_KEYS.MODELS_BY_MAKE(validation.data.id),
    CACHE_TTL.MODELS,
    async () => {
      logInfo("Cache miss - fetching models from database", { makeId: validation.data.id });
      return await prisma.model.findMany({
        where: {
          makeId: validation.data.id
        },
        select: {
          id: true,
          name: true,
          lengthMm: true,
          widthMm: true,
          heightMm: true
        },
        orderBy: {
          name: 'asc'
        }
      });
    }
  );

  return NextResponse.json({ models }, { status: 200 });
}

export const GET = withErrorHandling(getModels);
