import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";
import setCookieParser from "set-cookie-parser";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const activatedUser = await orchestrator.activateUserByUserId(
        createdUser.id,
      );

      const sessionObject =
        await orchestrator.createSessionObject(activatedUser);

      const response = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toBe(
        "no-store, no-cache, must-revalidate, max-age=0",
      );

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: activatedUser.id,
        username: "UserWithValidSession",
        email: activatedUser.email,
        features: ["create:session", "read:session", "update:user"],
        created_at: activatedUser.created_at.toISOString(),
        updated_at: activatedUser.updated_at.toISOString(),
      });

      const renewedSessionObject = await session.getValidByToken(
        sessionObject.token,
      );

      expect(renewedSessionObject.expires_at > sessionObject.expires_at).toBe(
        true,
      );
      expect(renewedSessionObject.updated_at > sessionObject.updated_at).toBe(
        true,
      );

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: renewedSessionObject.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      });
    });

    test("With halfway expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS / 2),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithHalfwayExpiredSession",
      });

      const activatedUser = await orchestrator.activateUserByUserId(
        createdUser.id,
      );

      const sessionObject =
        await orchestrator.createSessionObject(activatedUser);

      jest.useRealTimers();

      const response = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: activatedUser.id,
        username: "UserWithHalfwayExpiredSession",
        email: activatedUser.email,
        features: ["create:session", "read:session", "update:user"],
        created_at: activatedUser.created_at.toISOString(),
        updated_at: activatedUser.updated_at.toISOString(),
      });

      const renewedSessionObject = await session.getValidByToken(
        sessionObject.token,
      );

      expect(renewedSessionObject.expires_at > sessionObject.expires_at).toBe(
        true,
      );
      expect(renewedSessionObject.updated_at > sessionObject.updated_at).toBe(
        true,
      );

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: renewedSessionObject.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      });
    });

    test("With nonexistent session", async () => {
      const nonexistentSessionToken =
        "5345365645463453543645644234casddsae23321";

      const response = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          Cookie: `session_id=${nonexistentSessionToken}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui uma sessão válida.",
        action: "Verifique se o usuário está logado e tente novamente.",
        status_code: 401,
      });

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      });
    });

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });

      const activatedUser = await orchestrator.activateUserByUserId(
        createdUser.id,
      );
      const sessionObject =
        await orchestrator.createSessionObject(activatedUser);

      jest.useRealTimers();

      const response = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui uma sessão válida.",
        action: "Verifique se o usuário está logado e tente novamente.",
        status_code: 401,
      });

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      });
    });
  });

  describe("Anonymous user", () => {
    test("With valid session", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/user`);
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não tem permissão para executar esta ação.",
        action:
          'Verifique se você tem a feature "read:session" e tente novamente.',
        status_code: 403,
      });
    });
  });
});
