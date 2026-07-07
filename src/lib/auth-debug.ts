const PREFIX = "[Csolve Auth]";

export type AuthDiagnosis = {
  source: "client-login" | "client-session" | "middleware" | "server-redirect";
  signedIn: boolean;
  userId?: string | null;
  /** Role from Clerk user publicMetadata (set by sync-clerk / admin) */
  publicMetadataRole?: string | null;
  /** Role embedded in JWT session claims (requires Clerk session token customization) */
  jwtRole?: string | null;
  issue?: "clerk-metadata" | "clerk-jwt" | "clerk-credentials" | "clerk-mfa" | "codebase" | null;
  message?: string;
};

export function logAuthDiagnosis(diagnosis: AuthDiagnosis) {
  const payload = {
    ...diagnosis,
    timestamp: new Date().toISOString(),
  };

  if (diagnosis.issue) {
    console.warn(PREFIX, diagnosis.message ?? "Auth issue detected", payload);
  } else {
    console.info(PREFIX, diagnosis.message ?? "Auth check", payload);
  }

  return payload;
}

export function diagnoseRoleAccess(
  publicMetadataRole?: string | null,
  jwtRole?: string | null
): Pick<AuthDiagnosis, "issue" | "message"> {
  if (!publicMetadataRole) {
    return {
      issue: "clerk-metadata",
      message:
        "CLERK: User has no public_metadata.role. Run npm run sync-clerk or set role in Clerk Dashboard.",
    };
  }

  if (!jwtRole) {
    return {
      issue: "clerk-jwt",
      message:
        "CLERK: Role exists in publicMetadata but not in JWT. Add session token customization in Clerk Dashboard → Sessions.",
    };
  }

  if (publicMetadataRole !== jwtRole) {
    return {
      issue: "clerk-jwt",
      message: `CLERK: JWT role (${jwtRole}) does not match publicMetadata (${publicMetadataRole}). Sign out and sign in again.`,
    };
  }

  return { issue: null, message: "Role OK — redirecting to dashboard." };
}

export function dashboardPathForRole(role: string) {
  const allowed = ["admin", "teacher", "student", "parent"];
  return allowed.includes(role) ? `/${role}` : "/";
}
