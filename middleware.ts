import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCanonicalPathname } from "@/lib/canonical-path";

const isProtectedPageRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/entries(.*)",
  "/analytics(.*)",
]);

const isProtectedApiRoute = createRouteMatcher([
  "/api/entries(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const canonicalPathname = getCanonicalPathname(request.nextUrl.pathname);

  if (canonicalPathname !== request.nextUrl.pathname) {
    const url = request.nextUrl.clone();
    url.pathname = canonicalPathname;
    return NextResponse.redirect(url);
  }

  if (isProtectedPageRoute(request)) {
    await auth.protect({
      unauthenticatedUrl: new URL("/sign-in", request.url).toString(),
    });
  }

  if (isProtectedApiRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
