import { listAuditLogs } from "@/lib/audit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Audit Logs" };

const AuditLogsPage = async ({
  searchParams,
}: {
  searchParams: { page?: string; entity?: string };
}) => {
  const page = parseInt(searchParams.page || "1", 10);
  const { data, total, limit } = await listAuditLogs({
    page,
    limit: 25,
    entity: searchParams.entity,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All create, update, and delete mutations are recorded here.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Badge variant="outline">{total} total</Badge>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No audit logs yet. Mutations from the dashboard and API will appear here.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-2">Time</th>
                  <th className="p-2">User</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Action</th>
                  <th className="p-2">Entity</th>
                  <th className="p-2">ID</th>
                </tr>
              </thead>
              <tbody>
                {data.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/30">
                    <td className="p-2 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-2 font-mono text-xs">{log.userId.slice(0, 12)}…</td>
                    <td className="p-2 capitalize">{log.userRole}</td>
                    <td className="p-2">
                      <Badge
                        variant={
                          log.action === "DELETE"
                            ? "destructive"
                            : log.action === "CREATE"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-2 capitalize">{log.entity}</td>
                    <td className="p-2 font-mono text-xs">{log.entityId ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogsPage;
