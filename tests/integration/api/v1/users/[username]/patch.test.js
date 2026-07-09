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
    test("With non-existent username", async () => {
      const response = await fetch(
        `http://localhost:3000/api/v1/users/non-existent-username`,
        {
          method: "PATCH",
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
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user1",
          email: "user1@curso.dev",
          password: "senha123",
        }),
      });

      expect(user1Response.status).toBe(201);

      const user2Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user2",
          email: "user2@curso.dev",
          password: "senha123",
        }),
      });

      expect(user2Response.status).toBe(201);

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user1",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "Username já cadastrado",
        action: "Utilize outro username para esta operação",
        status_code: 400,
      });
    });

    test("With duplicated 'email'", async () => {
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "email1",
          email: "user1emailduplicado@curso.dev",
          password: "senha123",
        }),
      });

      expect(user1Response.status).toBe(201);

      const user2Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "email2",
          email: "user2emailduplicado@curso.dev",
          password: "senha123",
        }),
      });

      expect(user2Response.status).toBe(201);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/email2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
      const userPostresponse = await fetch(
        "http://localhost:3000/api/v1/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "uniqueuser1",
            email: "uniqueuser1@curso.dev",
            password: "senha123",
          }),
        },
      );

      expect(userPostresponse.status).toBe(201);

      const userPatchResponse = await fetch(
        "http://localhost:3000/api/v1/users/uniqueuser1",
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

      expect(userPatchResponse.status).toBe(200);

      const userPatchResponseBody = await userPatchResponse.json();

      expect(userPatchResponseBody).toEqual({
        id: userPatchResponseBody.id,
        username: "uniqueuser2",
        email: "uniqueuser1@curso.dev",
        password: userPatchResponseBody.password,
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
      const userPostresponse = await fetch(
        "http://localhost:3000/api/v1/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "uniquemail1",
            email: "uniquemail1@curso.dev",
            password: "senha123",
          }),
        },
      );

      expect(userPostresponse.status).toBe(201);

      const userPatchResponse = await fetch(
        "http://localhost:3000/api/v1/users/uniquemail1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
      const userPostresponse = await fetch(
        "http://localhost:3000/api/v1/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "newpassword1",
            email: "newpassword1@curso.dev",
            password: "senha123",
          }),
        },
      );

      expect(userPostresponse.status).toBe(201);

      const userPatchResponse = await fetch(
        "http://localhost:3000/api/v1/users/newpassword1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
});
