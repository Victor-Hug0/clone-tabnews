import database from "infra/database.js";
import { InternalServerError, MethodNotAllowedError } from "infra/errors.js";
import { createRouter } from "next-connect";

const router = createRouter();

router.get(getHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  console.error(publicErrorObject);
  response
    .status(publicErrorObject.statusCode)
    .json(publicErrorObject.toJSON());
}

function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({
    cause: error,
  });
  console.error(publicErrorObject);
  response.status(500).json(publicErrorObject.toJSON());
}

async function getHandler(request, response) {
  const updatedAt = new Date().toISOString();

  const versionResult = await database.query("SHOW server_version;");
  const dbVersion = versionResult.rows[0].server_version;

  const maxConectionsResult = await database.query(`SHOW max_connections;`);
  const maxConnections = maxConectionsResult.rows[0].max_connections;

  const currentConnectionsResult = await database.query(`
      SELECT count(*) FROM pg_stat_database WHERE datname = current_database();
    `);

  const currentConnections = currentConnectionsResult.rows[0].count;

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        db_version: dbVersion,
        max_connections: parseInt(maxConnections, 10),
        current_connections: parseInt(currentConnections, 10),
      },
    },
  });
}
