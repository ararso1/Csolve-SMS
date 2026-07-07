import { API_ENTITIES } from "@/lib/api/entities";
import { apiSuccess } from "@/lib/api/response";

export async function GET() {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "Csolve SMS API",
      version: "1.0.0",
      description:
        "REST API v1 for Csolve School Management System. Authenticate with Clerk session cookie or Bearer JWT.",
    },
    servers: [{ url: "/api/v1" }],
    paths: {
      "/{entity}": {
        get: {
          summary: "List records",
          parameters: [
            { name: "entity", in: "path", required: true, schema: { type: "string" } },
            { name: "page", in: "query", schema: { type: "integer" } },
            { name: "limit", in: "query", schema: { type: "integer" } },
          ],
        },
        post: {
          summary: "Create record (events, announcements only)",
        },
      },
      "/{entity}/{id}": {
        get: { summary: "Get record by id" },
        delete: { summary: "Delete record by id" },
      },
      "/audit-logs": {
        get: { summary: "List audit logs (admin)" },
      },
    },
    components: {
      securitySchemes: {
        clerkAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ clerkAuth: [] }],
    "x-entities": Object.keys(API_ENTITIES),
  };

  return apiSuccess(spec);
}
