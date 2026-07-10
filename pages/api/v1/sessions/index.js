import { createRouter } from "next-connect";
import user from "models/user.js";
import password from "models/password.js";
import { UnauthorizedError } from "infra/errors.js";
import controller from "infra/controller.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputvalues = request.body;

  try {
    const storedUser = await user.getByEmail(userInputvalues.email);
    const correctPasswordMatch = await password.compare(
      userInputvalues.password,
      storedUser.password,
    );

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Senha inválida.",
        action: "Verifique se a senha está correta e tente novamente.",
      });
    }
  } catch (error) {
    throw new UnauthorizedError({
      message: "Email ou senha inválidos.",
      action:
        "Verifique se o email e a senha estão corretos e tente novamente.",
    });
  }

  return response.status(201).json({});
}
