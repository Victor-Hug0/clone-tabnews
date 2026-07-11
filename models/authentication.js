import user from "models/user.js";
import password from "models/password.js";
import { UnauthorizedError, NotFoundError } from "infra/errors.js";

async function getAuthenticatedUser(providedEmail, providedPassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);

    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Email ou senha inválidos.",
        action:
          "Verifique se o email e a senha estão corretos e tente novamente.",
      });
    }

    throw error;
  }

  async function findUserByEmail(providedEmail) {
    try {
      return await user.getByEmail(providedEmail);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Email não encontrado.",
          action: "Verifique se o email está correto e tente novamente.",
        });
      }

      throw error;
    }
  }

  async function validatePassword(providedPassword, storedPassword) {
    const correctPasswordMatch = await password.compare(
      providedPassword,
      storedPassword,
    );

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Senha inválida.",
        action: "Verifique se a senha está correta e tente novamente.",
      });
    }
  }
}



const authentication = {
  getAuthenticatedUser,
};

export default authentication;
