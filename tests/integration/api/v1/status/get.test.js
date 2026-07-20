import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/status`);
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.updated_at).toBeDefined();
      expect(responseBody.dependencies.database.max_connections).toBeDefined();
      expect(
        responseBody.dependencies.database.current_connections,
      ).toBeDefined();

      const parsedUpdatedAt = new Date(responseBody.updated_at);
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt.toISOString());

      expect(typeof responseBody.dependencies.database.max_connections).toBe(
        "number",
      );
      expect(
        typeof responseBody.dependencies.database.current_connections,
      ).toBe("number");

      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.current_connections).toEqual(1);
      expect(responseBody.dependencies.database.db_version).not.toBeDefined();
    });
  });

  describe("Privileged user", () => {
    test("Retrieving current system status", async () => {
      const createUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUserByUserId(
        createUser.id,
      );
      const sessionObject = await orchestrator.createSessionObject(
        activatedUser.id,
      );
      await orchestrator.addFeaturesToUser(activatedUser, ["read:status:all"]);

      const response = await fetch(`${webserver.origin}/api/v1/status`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.updated_at).toBeDefined();
      expect(responseBody.dependencies.database.db_version).toBeDefined();
      expect(responseBody.dependencies.database.max_connections).toBeDefined();
      expect(
        responseBody.dependencies.database.current_connections,
      ).toBeDefined();

      const parsedUpdatedAt = new Date(responseBody.updated_at);
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt.toISOString());

      expect(typeof responseBody.dependencies.database.db_version).toBe(
        "string",
      );
      expect(typeof responseBody.dependencies.database.max_connections).toBe(
        "number",
      );
      expect(
        typeof responseBody.dependencies.database.current_connections,
      ).toBe("number");

      expect(responseBody.dependencies.database.db_version).toEqual("16.0");

      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.current_connections).toEqual(1);
    });
  });
});
