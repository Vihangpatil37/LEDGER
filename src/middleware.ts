import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/auth/confirm",
];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const { supabaseResponse, user } = await updateSession(request);

  // Authenticated users hitting /login go to /
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Unauthenticated requests for any path outside public paths redirect to /login?next=<path>
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const nextDestination = `${pathname}${search}`;
    url.search = `next=${encodeURIComponent(nextDestination)}`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static image/asset extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
