import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/api/health",
  "/api/auth/redirect",
  "/api/v1/openapi",
]);

const isApiRoute = createRouteMatcher(["/api/v1(.*)"]);

const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  return response;
}

export default clerkMiddleware((auth, req) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const path = req.nextUrl.pathname;

  if (path === "/" && userId) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/api/auth/redirect", req.url))
    );
  }

  if (path === "/continue") {
    const target = userId ? "/api/auth/redirect" : "/";
    return withSecurityHeaders(NextResponse.redirect(new URL(target, req.url)));
  }

  if (!isPublicRoute(req) && !isApiRoute(req)) {
    auth().protect();
  }

  if (isApiRoute(req) && path !== "/api/v1/openapi") {
    if (!userId) {
      return withSecurityHeaders(
        NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 })
      );
    }
  }

  for (const { matcher, allowedRoles } of matchers) {
    if (matcher(req) && role && !allowedRoles.includes(role)) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL(`/${role}`, req.url))
      );
    }
  }

  return withSecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
