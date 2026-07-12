import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import session from "models/session.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputvalues = request.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputvalues.email,
    userInputvalues.password,
  );

  const newSession = await session.create(authenticatedUser.id);

  controller.setSessionCookie(response, newSession.token);

  return response.status(201).json(newSession);
}
