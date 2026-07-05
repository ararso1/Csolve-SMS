"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BRAND } from "@/lib/brand";

const labelMap: Record<string, string> = {
  admin: "Admin Dashboard",
  teacher: "Teacher Dashboard",
  student: "Student Dashboard",
  parent: "Parent Dashboard",
  list: "Lists",
  teachers: "Teachers",
  students: "Students",
  parents: "Parents",
  subjects: "Subjects",
  classes: "Classes",
  lessons: "Lessons",
  exams: "Exams",
  assignments: "Assignments",
  results: "Results",
  attendance: "Attendance",
  events: "Events",
  announcements: "Announcements",
  messages: "Messages",
  profile: "Profile",
  settings: "Settings",
};

const PageBreadcrumbs = () => {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length) return null;

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = labelMap[segment] || segment;
    const isLast = index === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/admin">{BRAND.shortName}</BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb) => (
          <span key={crumb.href} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default PageBreadcrumbs;
