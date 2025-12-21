// path: middleware.ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// This line explicitly tells Next.js to run this middleware in the full Node.js environment,
// which is required by the Supabase SSR library and resolves potential build errors.
export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  // update user's auth session
  return await updateSession(request);
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * Feel free to modify this pattern to include more paths.
   */
  matcher: [
    "/dashboard/:path*",
    "/doc/:path*",
    "/onboarding/:path*",
    "/api/((?!auth).*)", // Protect API routes except auth
  ],
};