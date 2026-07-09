import database from "infra/database.js";
import password from "models/password.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function create(userData) {
  await validateUniqueEmail(userData.email);
  await validateUniqueUsername(userData.username);
  await hashPasswordInObject(userData);

  const newUser = await runInsertQuery(userData);
  return newUser;

  async function runInsertQuery(userData) {
    const result = await database.query({
      text: `
              INSERT INTO users (username, email, password)
              VALUES ($1, $2, $3)
              RETURNING *
          `,
      values: [userData.username, userData.email, userData.password],
    });
    return result.rows[0];
  }

  async function validateUniqueEmail(email) {
    const result = await database.query({
      text: `
        SELECT email FROM users WHERE LOWER(email) = LOWER($1)
      `,
      values: [email],
    });

    if (result.rowCount > 0) {
      throw new ValidationError({
        message: "E-mail já cadastrado",
        action: "Utilize outro e-mail para realizar o cadastro",
      });
    }
  }

  async function validateUniqueUsername(username) {
    const result = await database.query({
      text: `
        SELECT username FROM users WHERE LOWER(username) = LOWER($1)
      `,
      values: [username],
    });

    if (result.rowCount > 0) {
      throw new ValidationError({
        message: "Username já cadastrado",
        action: "Utilize outro username para realizar o cadastro",
      });
    }
  }

  async function hashPasswordInObject(userData) {
    const hashedPassword = await password.hash(userData.password);
    userData.password = hashedPassword;
  }
}

async function getByUsername(username) {
  const userFound = await runSelectQuery(username);
  return userFound;

  async function runSelectQuery(username) {
    const result = await database.query({
      text: `
        SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1
      `,
      values: [username],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "O username informado não foi encontrado.",
        action: "Verifique se o username está correto e tente novamente.",
      });
    }
    return result.rows[0];
  }
}

const user = {
  create,
  getByUsername,
};

export default user;
