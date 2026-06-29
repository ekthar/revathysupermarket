import { expect, test } from "@playwright/test";

test.describe("Health Endpoint", () => {
  test("/api/health returns structured response", async ({ request }) => {
    const response = await request.get("/api/health");

    // Should return 200 or 503 (depending on db/redis connectivity)
    expect([200, 503]).toContain(response.status());

    const body = await response.json();

    // Required fields
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("version");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("checks");
    expect(body).toHaveProperty("totalLatencyMs");

    // Status should be "healthy" or "degraded"
    expect(["healthy", "degraded"]).toContain(body.status);

    // Checks should include database and redis
    expect(body.checks).toHaveProperty("database");
    expect(body.checks).toHaveProperty("redis");

    // Each check has a status field
    expect(["ok", "error"]).toContain(body.checks.database.status);
    expect(["ok", "error"]).toContain(body.checks.redis.status);
  });

  test("/api/health has no-cache headers", async ({ request }) => {
    const response = await request.get("/api/health");
    const cacheControl = response.headers()["cache-control"];
    expect(cacheControl).toContain("no-store");
  });
});
