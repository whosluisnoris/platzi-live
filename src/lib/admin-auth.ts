import type { NextRequest } from "next/server";
import { getCurrentUser, isStaff } from "@/lib/auth";

// Autorización de las rutas /api/admin/*. Dos vías válidas:
//   1. Sesión con rol de staff (owner/admin) — el panel web usa esto.
//   2. Header `Authorization: Bearer <ADMIN_SECRET>` — respaldo programático
//      (crons/manual). Fail-closed: sin secreto configurado, esa vía no aplica.
export async function authorizeAdmin(request: NextRequest): Promise<boolean> {
  const user = await getCurrentUser();
  if (user && isStaff(user.role)) return true;
  return hasAdminSecret(request);
}

// Solo el secreto compartido (sin mirar la sesión). Se conserva para usos
// programáticos como `/api/live?debug=<ADMIN_SECRET>`.
export function hasAdminSecret(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}
