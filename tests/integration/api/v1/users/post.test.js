import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";
import user from "models/user.js";
import password from "models/password.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch(`http://localhost:3000/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "John Doe",
          email: "john.doe@example.com",
          password: "123456",
        }),
      });
      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "John Doe",
        email: "john.doe@example.com",
        password: responseBody.password,
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.getByUsername("John Doe");
      const correctPassword = await password.compare(
        "123456",
        userInDatabase.password,
      );
      expect(correctPassword).toBe(true);

      const incorrectPassword = await password.compare(
        "1234567",
        userInDatabase.password,
      );
      expect(incorrectPassword).toBe(false);
    });

    test("With duplicated e-mail", async () => {
      const response1 = await fetch(`http://localhost:3000/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado1",
          email: "emailduplicado@example.com",
          password: "123456",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(`http://localhost:3000/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado2",
          email: "Emailduplicado@example.com",
          password: "123456",
        }),
      });

      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "E-mail já cadastrado",
        action: "Utilize outro e-mail para esta operação",
        status_code: 400,
      });
    });

    test("With duplicated username", async () => {
      const response1 = await fetch(`http://localhost:3000/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "usernameduplicado",
          email: "usernameduplicado1@example.com",
          password: "123456",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(`http://localhost:3000/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "usernameduplicado",
          email: "usernameduplicado2@example.com",
          password: "123456",
        }),
      });

      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "Username já cadastrado",
        action: "Utilize outro username para esta operação",
        status_code: 400,
      });
    });
  });

  describe("Default user", () => {
    test("With unique and valid data", async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUserByUserId(user1.id);
      const user1SessionObject = await orchestrator.createSessionObject(
        user1.id,
      );

      const user2response = await fetch(`http://localhost:3000/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user1SessionObject.token}`,
        },
        body: JSON.stringify({
          username: "usuariologado",
          email: "usuariologado@example.com",
          password: "123456",
        }),
      });
      expect(user2response.status).toBe(403);
      const user2responseBody = await user2response.json();

      expect(user2responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não tem permissão para executar esta ação.",
        action:
          'Verifique se você tem a feature "create:user" e tente novamente.',
        status_code: 403,
      });
    });
  });
});
