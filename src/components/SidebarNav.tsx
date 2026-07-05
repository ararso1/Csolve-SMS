"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { menuSections } from "@/lib/menu";
import LogoutButton from "./LogoutButton";

const SidebarNav = ({
  role,
  dashboardHref,
  onNavigate,
}: {
  role: string;
  dashboardHref: string;
  onNavigate?: () => void;
}) => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const resolved = href === "dashboard" ? dashboardHref : href;
    if (resolved === dashboardHref) {
      return pathname === dashboardHref;
    }
    return pathname === resolved || pathname.startsWith(`${resolved}/`);
  };

  return (
    <nav className="mt-4 text-sm" aria-label="Main navigation">
      {menuSections.map((section) => (
        <div className="flex flex-col gap-1 mb-4" key={section.title}>
          <span className="hidden lg:block text-muted-foreground font-medium text-xs uppercase tracking-wide my-3 px-2">
            {section.title}
          </span>
          {section.items.map((item) => {
            if (!item.visible.includes(role)) return null;
            const href = item.href === "dashboard" ? dashboardHref : item.href;
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center justify-center lg:justify-start gap-3 py-2.5 px-2 rounded-md transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
      {role && (
        <div className="pt-2 border-t">
          <LogoutButton onNavigate={onNavigate} />
        </div>
      )}
    </nav>
  );
};

export default SidebarNav;
