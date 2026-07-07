import { auth, currentUser } from "@clerk/nextjs/server";
import { dashboardPathForRole, logAuthDiagnosis } from "@/lib/auth-debug";
import { NextResponse } from "next/server";

/**
 * Post-login redirect using Clerk server API (reads publicMetadata directly).
 * Works even when JWT session token is not yet customized.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const { userId, sessionClaims } = auth();
  const user = await currentUser();

  const publicMetadataRole = user?.publicMetadata?.role as string | undefined;
  const jwtRole = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || !user) {
    logAuthDiagnosis({
      source: "server-redirect",
      signedIn: false,
      userId,
      issue: "codebase",
      message: "Not signed in — redirecting to login",
    });
    return NextResponse.redirect(new URL("/?error=not-signed-in", origin));
  }

  if (!publicMetadataRole) {
    logAuthDiagnosis({
      source: "server-redirect",
      signedIn: true,
      userId,
      publicMetadataRole,
      jwtRole,
      issue: "clerk-metadata",
      message:
        "CLERK: No public_metadata.role on user. Run npm run sync-clerk.",
    });
    return NextResponse.redirect(new URL("/?error=no-role", origin));
  }

  if (!jwtRole) {
    logAuthDiagnosis({
      source: "server-redirect",
      signedIn: true,
      userId,
      publicMetadataRole,
      jwtRole,
      issue: "clerk-jwt",
      message:
        "CLERK: JWT missing role — customize session token for middleware RBAC. Redirecting via publicMetadata.",
    });
  } else {
    logAuthDiagnosis({
      source: "server-redirect",
      signedIn: true,
      userId,
      publicMetadataRole,
      jwtRole,
      issue: null,
      message: `Redirecting to /${publicMetadataRole}`,
    });
  }

  const target = dashboardPathForRole(publicMetadataRole);
  return NextResponse.redirect(new URL(target, origin));
}
