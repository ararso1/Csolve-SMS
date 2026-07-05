"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BRAND } from "@/lib/brand";
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

const LoginPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const role = user.publicMetadata?.role as string | undefined;
    if (role) {
      router.replace(`/${role}`);
    }
  }, [isLoaded, isSignedIn, user, router]);

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
          <SignIn.Root path="/">
            <Clerk.GlobalError className="text-sm text-destructive mb-4" />

            <SignIn.Step name="start" className="flex flex-col gap-4">
              <Clerk.Field name="identifier" className="flex flex-col gap-2">
                <Label htmlFor="identifier">Email or username</Label>
                <Clerk.Input type="text" required asChild>
                  <Input id="identifier" autoComplete="username" />
                </Clerk.Input>
                <p className="text-xs text-muted-foreground">
                  Seed admin:{" "}
                  <span className="font-mono">admin1@csolve-sms.dev</span>
                </p>
                <Clerk.FieldError className="text-xs text-destructive" />
              </Clerk.Field>
              <SignIn.Action submit asChild>
                <Button type="submit" className="w-full">
                  Continue
                </Button>
              </SignIn.Action>
            </SignIn.Step>

            <SignIn.Step name="verifications" className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Welcome back <SignIn.Salutation />! Enter your password.
              </p>
              <SignIn.Strategy name="password">
                <Clerk.Field name="password" className="flex flex-col gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Clerk.Input type="password" required asChild>
                    <Input id="password" type="password" autoComplete="current-password" />
                  </Clerk.Input>
                  <Clerk.FieldError className="text-xs text-destructive" />
                </Clerk.Field>
                <SignIn.Action submit asChild>
                  <Button type="submit" className="w-full mt-2">
                    Sign In
                  </Button>
                </SignIn.Action>
              </SignIn.Strategy>
            </SignIn.Step>
          </SignIn.Root>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
