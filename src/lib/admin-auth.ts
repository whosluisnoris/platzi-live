import type { NextRequest } from "next/server";

// Autorización de las rutas /api/admin/*: header `Authorization: Bearer <ADMIN_SECRET>`.
// Sin `ADMIN_SECRET` configurado, nadie está autorizado (fail-closed).
export function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}
