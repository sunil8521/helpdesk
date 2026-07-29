import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass static assets, Next.js internal files, API routes, and public widget embed scripts
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/widget") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Decode the JWT token from the session cookie (no DB call, no cookie trust)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;
  const onboardingCompleted = token?.onboardingCompleted === true;

  const isLandingPage = pathname === "/";
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isOnboardingPage = pathname.startsWith("/onboarding");
  const isDashboardPage = pathname.startsWith("/dashboard");

  // Rule 1: Authenticated user attempting to visit Landing Page (/)
  if (isAuthenticated && isLandingPage) {
    if (onboardingCompleted) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // Rule 2: Unauthenticated user trying to access protected routes (/dashboard or /onboarding)
  if (!isAuthenticated && (isDashboardPage || isOnboardingPage)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rule 3: Authenticated user accessing auth pages (/login or /signup)
  if (isAuthenticated && isAuthPage) {
    if (onboardingCompleted) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // Rule 4: Authenticated user attempting to access /dashboard before completing onboarding
  if (isAuthenticated && isDashboardPage && !onboardingCompleted) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // Rule 5: Authenticated user who ALREADY completed onboarding trying to re-visit /onboarding
  if (isAuthenticated && isOnboardingPage && onboardingCompleted) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/onboarding/:path*", "/login", "/signup"],
};
