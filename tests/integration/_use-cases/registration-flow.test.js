import webserver from "infra/webserver.js";
import activation from "models/activation.js";
import user from "models/user.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration flow (all successful)", () => {
  let createUserResponseBody;
  let activationTokenId;

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

    createUserResponseBody = await createUserResponse.json();
    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: "RegistrationFlow",
      email: "registration.flow@example.com",
      password: createUserResponseBody.password,
      features: ["read:activation_token"],
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    activationTokenId = orchestrator.extractUUID(lastEmail.text);

    const activationTokenObject =
      await activation.getValidById(activationTokenId);

    expect(lastEmail.sender).toBe("<contato@shoppingway.com.br>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@example.com>");
    expect(lastEmail.subject).toBe("Ative seu cadastro!");
    expect(lastEmail.text).toContain("RegistrationFlow");
    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/ativar/${activationTokenId}`,
    );
    expect(activationTokenObject.id).toBe(activationTokenId);
    expect(activationTokenObject.user_id).toBe(createUserResponseBody.id);
    expect(activationTokenObject.expires_at > new Date()).toBe(true);
    expect(activationTokenObject.used_at).toBeNull();
  });

  test("Activate user account", async () => {
    const activationResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${activationTokenId}`,
      {
        method: "PATCH",
      },
    );
    expect(activationResponse.status).toBe(200);

    const activationResponseBody = await activationResponse.json();

    expect(Date.parse(activationResponseBody.used_at)).not.toBeNull();

    const activatedUser = await user.getByUsername("RegistrationFlow");
    expect(activatedUser.features).toEqual(["create:session"]);
  });

  test("Login", async () => {});

  test("Get user information", async () => {});
});
