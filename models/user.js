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

async function getById(id) {
  const userFound = await runSelectQuery(id);
  return userFound;

  async function runSelectQuery(id) {
    const result = await database.query({
      text: `
        SELECT * FROM users WHERE id = $1 LIMIT 1
      `,
      values: [id],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "O id informado não foi encontrado.",
        action: "Verifique se o id está correto e tente novamente.",
      });
    }
    return result.rows[0];
  }
}

async function getByEmail(email) {
  const userFound = await runSelectQuery(email);
  return userFound;

  async function runSelectQuery(email) {
    const result = await database.query({
      text: `
        SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1
      `,
      values: [email],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "O e-mail informado não foi encontrado.",
        action: "Verifique se o e-mail está correto e tente novamente.",
      });
    }
    return result.rows[0];
  }
}

async function update(username, userInputValues) {
  const userFound = await getByUsername(username);

  if ("username" in userInputValues) {
    await validateUniqueUsername(userInputValues.username);
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }

  if ("password" in userInputValues) {
    await hashPasswordInObject(userInputValues);
  }

  const userWithUpdatedValues = { ...userFound, ...userInputValues };

  const updatedUser = await runUpdateQuery(userWithUpdatedValues);

  return updatedUser;

  async function runUpdateQuery(userWithUpdatedValues) {
    const result = await database.query({
      text: `
        UPDATE users SET username = $1, email = $2, password = $3, updated_at = timezone('utc', now()) WHERE id = $4
        RETURNING *
      `,
      values: [
        userWithUpdatedValues.username,
        userWithUpdatedValues.email,
        userWithUpdatedValues.password,
        userWithUpdatedValues.id,
      ],
    });
    return result.rows[0];
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
      action: "Utilize outro username para esta operação",
    });
  }
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
      action: "Utilize outro e-mail para esta operação",
    });
  }
}

async function hashPasswordInObject(userData) {
  const hashedPassword = await password.hash(userData.password);
  userData.password = hashedPassword;
}

const user = {
  create,
  getByUsername,
  getByEmail,
  getById,
  update,
};

export default user;
