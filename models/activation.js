import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
import { NotFoundError } from "infra/errors.js";
import user from "models/user.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "<contato@shoppingway.com.br>",
    to: user.email,
    subject: "Ative seu cadastro!",
    text: `${user.username}, clique no link abaixo para ativar o seu cadastro no ShoppingWay!

${webserver.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente,
Equipe ShoppingWay`,
  });
}

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `INSERT INTO user_activation_tokens (user_id, expires_at)
      VALUES ($1, $2)
      RETURNING *`,
      values: [userId, expiresAt],
    });
    return results.rows[0];
  }
}

async function getValidById(activationTokenId) {
  const newToken = await runSelectQuery(activationTokenId);
  return newToken;

  async function runSelectQuery(activationTokenId) {
    const results = await database.query({
      text: `SELECT * FROM user_activation_tokens
      WHERE id = $1 AND expires_at > timezone('utc', now()) AND used_at IS NULL
      LIMIT 1`,
      values: [activationTokenId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O token de ativação informado não é válido ou expirou.",
        action: "Faça um novo cadastro.",
      });
    }

    return results.rows[0];
  }
}

async function markTokenAsUsed(activationTokenId) {
  const usedToken = await runUpdateQuery(activationTokenId);
  return usedToken;

  async function runUpdateQuery(activationTokenId) {
    const results = await database.query({
      text: `UPDATE user_activation_tokens SET used_at = timezone('utc', now()), updated_at = timezone('utc', now())
      WHERE id = $1 RETURNING *`,
      values: [activationTokenId],
    });

    return results.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
  ]);
  return activatedUser;
}

const activation = {
  sendEmailToUser,
  create,
  getValidById,
  markTokenAsUsed,
  activateUserByUserId,
};

export default activation;
