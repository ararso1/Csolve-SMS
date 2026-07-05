import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import GlobalSearch from "./GlobalSearch";
import MobileSidebar from "./MobileSidebar";
import NotificationCenter from "./NotificationCenter";
import ThemeToggle from "./ThemeToggle";
import { Badge } from "./ui/badge";

const Navbar = async () => {
  const user = await currentUser();
  const role = user?.publicMetadata.role as string;
  const dashboardHref = role ? `/${role}` : "/";

  const announcementCount = user
    ? await prisma.announcement.count({
        where: {
          date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      })
    : 0;

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b bg-background/95 backdrop-blur p-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <MobileSidebar role={role} dashboardHref={dashboardHref} />
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <NotificationCenter count={Math.min(announcementCount, 9)} />
        <ThemeToggle />
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium leading-none">
            {user?.firstName} {user?.lastName}
          </span>
          <Badge variant="secondary" className="mt-1 capitalize text-[10px]">
            {role}
          </Badge>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
};

export default Navbar;
