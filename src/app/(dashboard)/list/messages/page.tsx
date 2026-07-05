import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Messages" };

const MessagesPage = () => {
  return (
    <Card className="m-0">
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState
          title="No messages yet"
          description="Direct messaging between teachers, students, and parents will be available in a future update."
        />
      </CardContent>
    </Card>
  );
};

export default MessagesPage;
