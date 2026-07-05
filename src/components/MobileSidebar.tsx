"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import SidebarNav from "./SidebarNav";
import { BRAND } from "@/lib/brand";

const MobileSidebar = ({
  role,
  dashboardHref,
}: {
  role: string;
  dashboardHref: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>{BRAND.name}</SheetTitle>
        </SheetHeader>
        <SidebarNav
          role={role}
          dashboardHref={dashboardHref}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
};

export default MobileSidebar;
