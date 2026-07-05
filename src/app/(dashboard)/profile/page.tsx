import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BRAND } from "@/lib/brand";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";

export const metadata = { title: "Profile" };

const ProfilePage = async () => {
  const user = await currentUser();
  if (!user) redirect("/");

  const role = (user.publicMetadata.role as string) || "user";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-6 items-start">
          <Image
            src={user.imageUrl}
            alt={`${user.firstName ?? "User"} profile photo`}
            width={96}
            height={96}
            className="rounded-full object-cover"
          />
          <div className="space-y-3 flex-1">
            <div>
              <p className="text-sm text-muted-foreground">Full name</p>
              <p className="font-semibold text-lg">
                {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                  user.username ||
                  "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p>{user.emailAddresses[0]?.emailAddress ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge className="capitalize">{role}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member since</p>
              <p>{new Date(user.createdAt!).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground text-center">
        {BRAND.name} · {BRAND.company}
      </p>
    </div>
  );
};

export default ProfilePage;
