import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
import { ForbiddenError } from "infra/errors.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const userFound = await user.getByUsername(request.query.username);

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:user",
    userFound,
  );
  response.status(200).json(secureOutputValues);
}

async function patchHandler(request, response) {
  const userInputValues = request.body;
  const username = request.query.username;

  const userTryingToPatch = request.context.user;
  const targetUser = await user.getByUsername(username);

  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Você não tem permissão para atualizar outro usuário.",
      action:
        "Verifique se você tem a feature para atualizar outro usuário e tente novamente.",
      status_code: 403,
    });
  }

  const updatedUser = await user.update(username, userInputValues);
  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:user",
    updatedUser,
  );
  response.status(200).json(secureOutputValues);
}
