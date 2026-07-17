import orchestrator from "tests/orchestrator.js";
import { describe } from "yargs";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration flow (all successful)", () => {
  test("Create user account", async () => {
    const createUserResponse = await fetch(
      `http://localhost:3000/api/v1/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "RegistrationFlow",
          email: "registration.flow@example.com",
          password: "RegistrationFlowPassword",
        }),
      },
    );
    expect(createUserResponse.status).toBe(201);

    const createUserResponseBody = await createUserResponse.json();
    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: "RegistrationFlow",
      email: "registration.flow@example.com",
      password: createUserResponseBody.password,
      features: [],
      createdAt: createUserResponseBody.createdAt,
      updatedAt: createUserResponseBody.updatedAt,
    });
  });

  test("Receive activation email", async () => {});

  test("Activate user account", async () => {});

  test("Login", async () => {});

  test("Get user information", async () => {});
});
