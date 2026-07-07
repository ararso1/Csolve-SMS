"use client";

import { useAuth, useClerk, useSignIn } from "@clerk/nextjs";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";
import { logAuthDiagnosis } from "@/lib/auth-debug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LoginStep = "credentials" | "verify";

type SecondFactorStrategy = "email_code" | "phone_code" | "totp" | "backup_code";

const LoginForm = () => {
  const { isLoaded: authLoaded, isSignedIn, userId } = useAuth();
  const { user } = useClerk();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<LoginStep>("credentials");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verifyStrategy, setVerifyStrategy] = useState<SecondFactorStrategy | null>(
    null
  );
  const [verifyHint, setVerifyHint] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const urlError = searchParams.get("error");

  const finishSignIn = async (sessionId: string | null) => {
    if (!sessionId) {
      setError("CLERK: Sign-in completed but no session was created.");
      return;
    }

    await setActive({ session: sessionId });
    console.info("[Csolve Auth] Session active → /api/auth/redirect");
    window.location.href = "/api/auth/redirect";
  };

  const prepareSecondFactor = async (resource: NonNullable<typeof signIn>) => {
    const factors = resource.supportedSecondFactors ?? [];

    console.info("[Csolve Auth] CLERK: Second factor required", {
      status: resource.status,
      factors: factors.map((f) => f.strategy),
      diagnosis:
        "CLERK Client Trust or MFA is enabled. This is not a codebase bug — Clerk requires a verification code.",
    });

    logAuthDiagnosis({
      source: "client-login",
      signedIn: false,
      issue: "clerk-mfa",
      message:
        "CLERK: Client Trust / MFA triggered. Enter the verification code sent by Clerk (usually email).",
    });

    const emailFactor = factors.find((f) => f.strategy === "email_code") as
      | { strategy: "email_code"; emailAddressId: string }
      | undefined;
    const phoneFactor = factors.find((f) => f.strategy === "phone_code") as
      | { strategy: "phone_code"; phoneNumberId: string }
      | undefined;
    const totpFactor = factors.find((f) => f.strategy === "totp");

    if (emailFactor) {
      await resource.prepareSecondFactor({
        strategy: "email_code",
        emailAddressId: emailFactor.emailAddressId,
      });
      setVerifyStrategy("email_code");
      setVerifyHint(
        `Verification code sent to your email. Check the inbox for ${identifier.includes("@") ? identifier : "the account email"} (and spam).`
      );
    } else if (phoneFactor) {
      await resource.prepareSecondFactor({
        strategy: "phone_code",
        phoneNumberId: phoneFactor.phoneNumberId,
      });
      setVerifyStrategy("phone_code");
      setVerifyHint("Verification code sent to your phone.");
    } else if (totpFactor) {
      setVerifyStrategy("totp");
      setVerifyHint("Enter the 6-digit code from your authenticator app.");
    } else {
      console.error("[Csolve Auth] CLERK: No supported second factor:", factors);
      setError(
        "CLERK: Second factor required but no method available. In Clerk Dashboard → Attack protection, disable Client Trust for local dev."
      );
      return;
    }

    setStep("verify");
  };

  useEffect(() => {
    if (!authLoaded) return;

    if (isSignedIn && userId) {
      logAuthDiagnosis({
        source: "client-session",
        signedIn: true,
        userId,
        publicMetadataRole: user?.publicMetadata?.role as string | undefined,
        message: "Session already active — sending to server redirect",
      });
      window.location.href = "/api/auth/redirect";
    }
  }, [authLoaded, isSignedIn, userId, user?.publicMetadata?.role]);

  useEffect(() => {
    if (urlError === "no-role") {
      setError(
        "Your Clerk account has no role. Run npm run sync-clerk or set publicMetadata.role in Clerk Dashboard."
      );
    } else if (urlError === "not-signed-in") {
      setError("Session expired. Please sign in again.");
    }
  }, [urlError]);

  const handleCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!signInLoaded || !signIn) return;

    setLoading(true);

    try {
      console.info("[Csolve Auth] Starting one-step sign-in…", {
        identifier: identifier.includes("@") ? identifier : `${identifier} (username)`,
      });

      const result = await signIn.create({
        identifier: identifier.trim(),
        password,
      });

      console.info("[Csolve Auth] Clerk signIn.create result:", {
        status: result.status,
        createdSessionId: result.createdSessionId,
        supportedSecondFactors: result.supportedSecondFactors?.map(
          (f) => f.strategy
        ),
      });

      if (result.status === "complete") {
        await finishSignIn(result.createdSessionId);
        return;
      }

      if (
        result.status === "needs_second_factor" ||
        result.status === "needs_client_trust"
      ) {
        await prepareSecondFactor(signIn);
        return;
      }

      console.error("[Csolve Auth] CLERK: Unhandled sign-in status:", result.status);
      setError(`Clerk returned status: ${result.status}. Check Clerk Dashboard auth settings.`);
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message?: string }[] };
      const message =
        clerkErr?.errors?.[0]?.message ||
        (err instanceof Error ? err.message : "Sign in failed");

      console.error("[Csolve Auth] CLERK sign-in error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!signInLoaded || !signIn || !verifyStrategy) return;

    setLoading(true);

    try {
      console.info("[Csolve Auth] Verifying second factor:", verifyStrategy);

      const result = await signIn.attemptSecondFactor({
        strategy: verifyStrategy,
        code: code.trim(),
      });

      console.info("[Csolve Auth] attemptSecondFactor result:", {
        status: result.status,
        createdSessionId: result.createdSessionId,
      });

      if (result.status === "complete") {
        await finishSignIn(result.createdSessionId);
        return;
      }

      setError(`Verification incomplete (${result.status}). Try again or request a new code.`);
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message?: string }[] };
      const message =
        clerkErr?.errors?.[0]?.message ||
        (err instanceof Error ? err.message : "Verification failed");

      console.error("[Csolve Auth] CLERK verification error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!signIn || verifyStrategy !== "email_code") return;

    const emailFactor = signIn.supportedSecondFactors?.find(
      (f) => f.strategy === "email_code"
    ) as { emailAddressId: string } | undefined;

    if (!emailFactor) return;

    setLoading(true);
    try {
      await signIn.prepareSecondFactor({
        strategy: "email_code",
        emailAddressId: emailFactor.emailAddressId,
      });
      setVerifyHint("A new code was sent to your email.");
    } catch (err) {
      console.error("[Csolve Auth] Resend code failed:", err);
      setError("Could not resend code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Image
              src="/logo.png"
              alt={`${BRAND.name} logo`}
              width={32}
              height={32}
            />
            <CardTitle>{BRAND.name}</CardTitle>
          </div>
          <CardDescription>
            {BRAND.tagline} · by {BRAND.company}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "credentials" ? (
            <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
              {error && (
                <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 p-3">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="identifier">Email or username</Label>
                <Input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin1@csolve-sms.dev"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Dev admin: <span className="font-mono">admin1@csolve-sms.dev</span> /{" "}
                <span className="font-mono">CsolveSmsDev</span>
              </p>

              <Button type="submit" className="w-full" disabled={loading || !signInLoaded}>
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit} className="flex flex-col gap-4">
              {error && (
                <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 p-3">
                  {error}
                </p>
              )}

              <p className="text-sm text-muted-foreground">{verifyHint}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 rounded-md border border-amber-500/30 bg-amber-500/10 p-2">
                CLERK Client Trust: extra verification on new devices. To skip in dev, disable
                Client Trust in Clerk Dashboard → Attack protection.
              </p>

              <div className="flex flex-col gap-2">
                <Label htmlFor="code">Verification code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying…" : "Verify & Sign In"}
              </Button>

              {verifyStrategy === "email_code" && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  onClick={handleResendCode}
                >
                  Resend email code
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("credentials");
                  setCode("");
                  setVerifyStrategy(null);
                  setError(null);
                  signIn?.reset();
                }}
              >
                Back to sign in
              </Button>
            </form>
          )}

          <p className="text-[10px] text-muted-foreground text-center mt-4">
            DevTools → Console → filter [Csolve Auth]
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const LoginPage = () => (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
    <LoginForm />
  </Suspense>
);

export default LoginPage;
