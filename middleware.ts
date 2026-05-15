// path: middleware.ts
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// This line explicitly tells Next.js to run this middleware in the full Node.js environment
export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define routes that should NEVER trigger a database connection check.
  // This prevents the entire app from crashing if Supabase is down/paused.
  const publicRoutes = [
    '/', 
    '/login', 
    '/signup', 
    '/forgot-password', 
    '/reset-password', 
    '/verify-email'
  ];

  // 2. If the user is on a public page or an auth callback, let them through immediately
  if (publicRoutes.includes(pathname) || pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  // 3. For all other routes (Dashboard, etc.), update the user's auth session
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/icons ending in specific extensions
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};