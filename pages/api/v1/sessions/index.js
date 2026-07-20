import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import session from "models/session.js";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputvalues = request.body;

  const authenticatedUser = await authentication.getUser(
    userInputvalues.email,
    userInputvalues.password,
  );

  if (!authorization.can(authenticatedUser, "create:session")) {
    throw new ForbiddenError({
      message: "Você não tem permissão para fazer login.",
      action:
        "Verifique se você tem a feature 'create:session' e tente novamente. Se o problema persistir, contate o suporte.",
    });
  }

  const newSession = await session.create(authenticatedUser.id);

  controller.setSessionCookie(response, newSession.token);

  const secureOutputValues = authorization.filterOutput(
    authenticatedUser,
    "read:session",
    newSession,
  );

  return response.status(201).json(secureOutputValues);
}

async function deleteHandler(request, response) {
  const sessionToken = request.cookies.session_id;
  const userTryingToDelete = request.context.user;

  const sessionObject = await session.getValidByToken(sessionToken);
  const expiredSessionObject = await session.expireById(sessionObject.id);

  controller.clearSessionCookie(response);

  const secureOutputValues = authorization.filterOutput(
    userTryingToDelete,
    "read:session",
    expiredSessionObject,
  );

  return response.status(200).json(secureOutputValues);
}
