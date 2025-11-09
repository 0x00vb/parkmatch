import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextRequest } from "next/server";
import { ApiError, API_ERRORS } from "./errors";

// Auth validation helper
export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw API_ERRORS.UNAUTHORIZED;
  }

  return session;
}

// Role-based access control
export async function requireRole(request: NextRequest, allowedRoles: string[]) {
  const session = await requireAuth(request);

  if (!allowedRoles.includes(session.user.role)) {
    throw API_ERRORS.FORBIDDEN;
  }

  return session;
}

// Owner-only access (for garages, etc.)
export async function requireOwner(request: NextRequest) {
  return requireRole(request, ['CONDUCTOR_PROPIETARIO']);
}

// Driver access (for vehicles, etc.)
export async function requireDriver(request: NextRequest) {
  return requireRole(request, ['CONDUCTOR', 'CONDUCTOR_PROPIETARIO']);
}

// Admin access (if needed in the future)
export async function requireAdmin(request: NextRequest) {
  return requireRole(request, ['ADMIN']);
}
