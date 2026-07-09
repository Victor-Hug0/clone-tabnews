import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";

const router = createRouter();

router.get(getHandler);
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userFound = await user.getByUsername(request.query.username);
  response.status(200).json(userFound);
}

async function patchHandler(request, response) {
  const userInputValues = request.body;

  const updatedUser = await user.update(
    request.query.username,
    userInputValues,
  );
  response.status(200).json(updatedUser);
}
