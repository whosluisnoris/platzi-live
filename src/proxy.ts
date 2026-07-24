import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Proxy (antes "middleware" — renombrado en Next.js 16). Refresca la sesión de
// Supabase en cada request para que las cookies de auth no expiren y el estado
// de sesión esté disponible en Server Components. No hace autorización aquí: las
// rutas protegidas verifican la sesión por su cuenta.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Tocar getUser() dispara el refresco del token si hace falta.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Todas las rutas salvo estáticos, imágenes y assets con extensión.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
