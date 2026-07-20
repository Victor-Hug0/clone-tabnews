import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/migrations`);
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não tem permissão para executar esta ação.",
        action:
          'Verifique se você tem a feature "read:migration" e tente novamente.',
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Retrieving pending migrations", async () => {
      const createUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUserByUserId(
        createUser.id,
      );
      const sessionObject =
        await orchestrator.createSessionObject(activatedUser);

      const response = await fetch(`${webserver.origin}/api/v1/migrations`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não tem permissão para executar esta ação.",
        action:
          'Verifique se você tem a feature "read:migration" e tente novamente.',
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("Retrieving pending migrations", async () => {
      const createUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUserByUserId(
        createUser.id,
      );
      const sessionObject =
        await orchestrator.createSessionObject(activatedUser);
      await orchestrator.addFeaturesToUser(activatedUser, ["read:migration"]);

      const response = await fetch(`${webserver.origin}/api/v1/migrations`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
