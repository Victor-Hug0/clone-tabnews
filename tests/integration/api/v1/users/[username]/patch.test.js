import password from "models/password";
import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";
import user from "models/user.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With unique 'username'", async () => {
      const createdUser2 = await orchestrator.createUser({
        username: "uniqueuser",
        email: "uniqueuser@curso.dev",
        password: "senha123",
      });

      const userPatchResponse = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "uniqueuser2",
          }),
        },
      );

      expect(userPatchResponse.status).toBe(403);

      const userPatchResponseBody = await userPatchResponse.json();

      expect(userPatchResponseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não tem permissão para executar esta ação.",
        action:
          'Verifique se você tem a feature "update:user" e tente novamente.',
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With non-existent username", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUserByUserId(
        createdUser.id,
      );
      const userSessionObject = await orchestrator.createSessionObject(
        activatedUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/non-existent-username`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${userSessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado.",
        action: "Verifique se o username está correto e tente novamente.",
        status_code: 404,
      });
    });

    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "user1",
        email: "user1@curso.dev",
        password: "senha123",
      });

      const createdUser2 = await orchestrator.createUser({
        username: "user2",
        email: "user2@curso.dev",
        password: "senha123",
      });

      const activatedUser = await orchestrator.activateUserByUserId(
        createdUser2.id,
      );
      const userSessionObject = await orchestrator.createSessionObject(
        activatedUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`,
          },
          body: JSON.stringify({
            username: "user1",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "Username já cadastrado",
        action: "Utilize outro username para esta operação",
        status_code: 400,
      });
    });

    test("With user2 targeting user1", async () => {
      const createdUser1 = await orchestrator.createUser({
        username: "username1",
        email: "username1@curso.dev",
        password: "senha123",
      });

      const createdUser2 = await orchestrator.createUser({
        username: "username2",
        email: "username2@curso.dev",
        password: "senha123",
      });

      const activatedUser = await orchestrator.activateUserByUserId(
        createdUser2.id,
      );
      const userSessionObject = await orchestrator.createSessionObject(
        activatedUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`,
          },
          body: JSON.stringify({
            username: "user3",
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não tem permissão para atualizar outro usuário.",
        action:
          "Verifique se você tem a feature para atualizar outro usuário e tente novamente.",
        status_code: 403,
      });
    });

    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        username: "email1",
        email: "user1emailduplicado@curso.dev",
        password: "senha123",
      });

      const createdUser2 = await orchestrator.createUser({
        username: "email2",
        email: "user2emailduplicado@curso.dev",
        password: "senha123",
      });

      const activatedUser = await orchestrator.activateUserByUserId(
        createdUser2.id,
      );
      const userSessionObject = await orchestrator.createSessionObject(
        activatedUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`,
          },
          body: JSON.stringify({
            email: "user1emailduplicado@curso.dev",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "E-mail já cadastrado",
        action: "Utilize outro e-mail para esta operação",
        status_code: 400,
      });
    });

    test("With unique 'username'", async () => {
      const createdUser2 = await orchestrator.createUser({
        username: "uniqueuser1",
        email: "uniqueuser1@curso.dev",
        password: "senha123",
      });

      const activatedUser = await orchestrator.activateUserByUserId(
        createdUser2.id,
      );
      const userSessionObject = await orchestrator.createSessionObject(
        activatedUser.id,
      );

      const userPatchResponse = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`,
          },
          body: JSON.stringify({
            username: "uniqueuser2",
          }),
        },
      );

      expect(userPatchResponse.status).toBe(200);

      const userPatchResponseBody = await userPatchResponse.json();

      expect(userPatchResponseBody).toEqual({
        id: userPatchResponseBody.id,
        username: "uniqueuser2",
        email: "uniqueuser1@curso.dev",
        password: userPatchResponseBody.password,
        features: ["create:session", "read:session", "update:user"],
        created_at: userPatchResponseBody.created_at,
        updated_at: userPatchResponseBody.updated_at,
      });

      expect(uuidVersion(userPatchResponseBody.id)).toBe(4);
      expect(Date.parse(userPatchResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(userPatchResponseBody.updated_at)).not.toBeNaN();
      expect(
        userPatchResponseBody.updated_at > userPatchResponseBody.created_at,
      ).toBe(true);
    });

    test("With unique 'email'", async () => {
      const createdUser2 = await orchestrator.createUser({
        username: "uniquemail1",
        email: "uniquemail1@curso.dev",
        password: "senha123",
      });

      const activatedUser = await orchestrator.activateUserByUserId(
        createdUser2.id,
      );
      const userSessionObject = await orchestrator.createSessionObject(
        activatedUser.id,
      );

      const userPatchResponse = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`,
          },
          body: JSON.stringify({
            email: "uniquemail2@curso.dev",
          }),
        },
      );

      expect(userPatchResponse.status).toBe(200);

      const userPatchResponseBody = await userPatchResponse.json();

      expect(userPatchResponseBody).toEqual({
        id: userPatchResponseBody.id,
        username: "uniquemail1",
        email: "uniquemail2@curso.dev",
        password: userPatchResponseBody.password,
        features: ["create:session", "read:session", "update:user"],
        created_at: userPatchResponseBody.created_at,
        updated_at: userPatchResponseBody.updated_at,
      });

      expect(uuidVersion(userPatchResponseBody.id)).toBe(4);
      expect(Date.parse(userPatchResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(userPatchResponseBody.updated_at)).not.toBeNaN();
      expect(
        userPatchResponseBody.updated_at > userPatchResponseBody.created_at,
      ).toBe(true);
    });

    test("With new 'password'", async () => {
      const createdUser2 = await orchestrator.createUser({
        username: "newpassword1",
        email: "newpassword1@curso.dev",
        password: "senha123",
      });

      const activatedUser = await orchestrator.activateUserByUserId(
        createdUser2.id,
      );
      const userSessionObject = await orchestrator.createSessionObject(
        activatedUser.id,
      );

      const userPatchResponse = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`,
          },
          body: JSON.stringify({
            password: "senha456",
          }),
        },
      );

      expect(userPatchResponse.status).toBe(200);

      const userPatchResponseBody = await userPatchResponse.json();

      expect(userPatchResponseBody).toEqual({
        id: userPatchResponseBody.id,
        username: "newpassword1",
        email: "newpassword1@curso.dev",
        password: userPatchResponseBody.password,
        features: ["create:session", "read:session", "update:user"],
        created_at: userPatchResponseBody.created_at,
        updated_at: userPatchResponseBody.updated_at,
      });

      expect(uuidVersion(userPatchResponseBody.id)).toBe(4);
      expect(Date.parse(userPatchResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(userPatchResponseBody.updated_at)).not.toBeNaN();
      expect(
        userPatchResponseBody.updated_at > userPatchResponseBody.created_at,
      ).toBe(true);

      const userInDatabase = await user.getByUsername("newpassword1");
      const correctPassword = await password.compare(
        "senha456",
        userInDatabase.password,
      );
      expect(correctPassword).toBe(true);

      const incorrectPassword = await password.compare(
        "senha123",
        userInDatabase.password,
      );
      expect(incorrectPassword).toBe(false);
    });
  });

  describe("Privileged user", () => {
    test("With update:user:others targeting defaultUser", async () => {
      const privilegedUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUserByUserId(
        privilegedUser.id,
      );
      await orchestrator.addFeaturesToUser(privilegedUser, [
        "update:user:others",
      ]);
      const userSessionObject = await orchestrator.createSessionObject(
        activatedUser.id,
      );

      const defaultUser = await orchestrator.createUser();

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`,
          },
          body: JSON.stringify({
            username: "defaultUser",
          }),
        },
      );

      expect(response.status).toBe(200);

      const userPatchResponseBody = await response.json();

      expect(userPatchResponseBody).toEqual({
        id: defaultUser.id,
        username: "defaultUser",
        email: defaultUser.email,
        password: defaultUser.password,
        features: defaultUser.features,
        created_at: defaultUser.created_at.toISOString(),
        updated_at: userPatchResponseBody.updated_at,
      });

      expect(uuidVersion(userPatchResponseBody.id)).toBe(4);
      expect(Date.parse(userPatchResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(userPatchResponseBody.updated_at)).not.toBeNaN();
      expect(
        userPatchResponseBody.updated_at > userPatchResponseBody.created_at,
      ).toBe(true);
    });
  });
});
