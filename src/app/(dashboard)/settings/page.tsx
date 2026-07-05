import ThemeToggle from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Settings" };

const SettingsPage = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how {BRAND.name} looks on your device.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Theme</p>
            <p className="text-sm text-muted-foreground">Switch between light and dark mode.</p>
          </div>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Announcements</p>
              <p className="text-sm text-muted-foreground">
                Show school announcements in the notification center.
              </p>
            </div>
            <span className="text-sm text-muted-foreground">Enabled</span>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Email and push notification preferences will be available in a future release.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">Application:</span> {BRAND.name}
          </p>
          <p>
            <span className="text-muted-foreground">Developer:</span> {BRAND.company}
          </p>
          <p>
            <span className="text-muted-foreground">Version:</span> 0.2.0
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
