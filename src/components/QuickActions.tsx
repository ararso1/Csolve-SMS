import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const quickLinks: Record<string, { label: string; href: string }[]> = {
  admin: [
    { label: "Add Student", href: "/list/students" },
    { label: "Add Teacher", href: "/list/teachers" },
    { label: "Mark Attendance", href: "/list/attendance" },
    { label: "New Announcement", href: "/list/announcements" },
  ],
  teacher: [
    { label: "My Lessons", href: "/list/lessons" },
    { label: "Create Exam", href: "/list/exams" },
    { label: "Mark Attendance", href: "/list/attendance" },
    { label: "Enter Results", href: "/list/results" },
  ],
  student: [
    { label: "My Schedule", href: "/student" },
    { label: "View Exams", href: "/list/exams" },
    { label: "My Results", href: "/list/results" },
    { label: "Attendance", href: "/list/attendance" },
  ],
  parent: [
    { label: "Child Schedule", href: "/parent" },
    { label: "View Results", href: "/list/results" },
    { label: "Attendance", href: "/list/attendance" },
    { label: "Announcements", href: "/list/announcements" },
  ],
};

const QuickActions = ({ role }: { role: string }) => {
  const links = quickLinks[role] || [];

  if (!links.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Button key={link.href} variant="secondary" size="sm" asChild>
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
