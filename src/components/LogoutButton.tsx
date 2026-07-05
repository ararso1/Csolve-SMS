"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const LogoutButton = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    onNavigate?.();
    router.push("/");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={cn(
        "flex items-center justify-center lg:justify-start gap-3 text-muted-foreground py-2.5 px-2 rounded-md hover:bg-accent hover:text-accent-foreground w-full transition-colors"
      )}
      aria-label="Sign out"
    >
      <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="hidden lg:block">Logout</span>
    </button>
  );
};

export default LogoutButton;
