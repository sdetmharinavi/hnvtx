// path: middleware.ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// --- THIS IS THE FIX ---
// This line explicitly tells Next.js to run this middleware in the full Node.js environment,
// which is required by the Supabase SSR library and resolves the build error.
export const runtime = 'nodejs';
// --- END FIX ---

export async function middleware(request: NextRequest) {
  // update user's auth session
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /auth/** (all auth API routes like callbacks)
     * - Public pages (login, signup, etc.)
     * - The root landing page ('/')
     * This ensures the middleware only runs on protected routes.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|auth/.*|^$|^login$|^signup$|^forgot-password$|^reset-password$|^verify-email$).*)",
  ],
};