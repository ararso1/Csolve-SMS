import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import { BRAND } from "@/lib/brand";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await currentUser();
  const role = user?.publicMetadata.role as string;
  const dashboardHref = role ? `/${role}` : "/";

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="hidden lg:flex w-64 xl:w-72 flex-col border-r bg-background p-4 shrink-0">
        <Link
          href={dashboardHref}
          className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-accent transition-colors"
        >
          <Image src="/logo.png" alt={`${BRAND.name} logo`} width={36} height={36} />
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight">{BRAND.name}</span>
            <span className="text-[10px] text-muted-foreground">
              by {BRAND.company}
            </span>
          </div>
        </Link>
        <Menu />
        <p className="mt-auto text-[10px] text-muted-foreground px-2 pt-6">
          © {new Date().getFullYear()} {BRAND.company}
        </p>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <PageBreadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
