import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect dashboard and practice routes
  const protectedRoutes = ["/dashboard", "/practice", "/pricing", "/settings"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Protect API routes that require authentication
  const protectedApiRoutes = ["/api/razorpay/create-order"];
  const isProtectedApiRoute = protectedApiRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Redirect authenticated users away from auth pages
  const authRoutes = ["/auth/login", "/auth/signup", "/auth/forgot-password"];
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (session) {
    if (isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } else {
    if (isProtectedRoute || isProtectedApiRoute) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|$).*)"],
};
