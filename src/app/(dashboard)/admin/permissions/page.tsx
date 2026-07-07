import { permissionMatrixRows, permissionsForRole } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Role Permissions" };

const roles = ["admin", "teacher", "student", "parent"] as const;

const PermissionsPage = () => {
  const matrix = permissionMatrixRows();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Role Permissions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Read-only view of the Csolve SMS permission matrix (resource × action × role).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="capitalize flex items-center gap-2">
                {role}
                <Badge variant="secondary">{permissionsForRole(role).length} permissions</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs font-mono space-y-1 max-h-48 overflow-y-auto">
                {permissionsForRole(role).map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Resource</th>
                <th className="p-2">Create</th>
                <th className="p-2">Read</th>
                <th className="p-2">Update</th>
                <th className="p-2">Delete</th>
                <th className="p-2">List</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.resource} className="border-b">
                  <td className="p-2 font-medium capitalize">{row.resource}</td>
                  {(["create", "read", "update", "delete", "list"] as const).map((action) => (
                    <td key={action} className="p-2 text-xs">
                      {row.actions[action].join(", ") || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        REST API: <code className="font-mono">GET /api/v1/openapi</code> · Audit:{" "}
        <code className="font-mono">GET /api/v1/audit-logs</code>
      </p>
    </div>
  );
};

export default PermissionsPage;
