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
  const userFound = await user.getByUsername(request.query.username);
  response.status(200).json(userFound);
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
  response.status(200).json(updatedUser);
}
