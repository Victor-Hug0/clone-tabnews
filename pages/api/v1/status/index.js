import controller from "infra/controller.js";
import database from "infra/database.js";
import authorization from "models/authorization.js";
import { createRouter } from "next-connect";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(getHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;

  const updatedAt = new Date().toISOString();

  const versionResult = await database.query("SHOW server_version;");
  const dbVersion = versionResult.rows[0].server_version;

  const maxConectionsResult = await database.query(`SHOW max_connections;`);
  const maxConnections = maxConectionsResult.rows[0].max_connections;

  const currentConnectionsResult = await database.query(`
      SELECT count(*) FROM pg_stat_database WHERE datname = current_database();
    `);

  const currentConnections = currentConnectionsResult.rows[0].count;

  const statusObject = {
    updated_at: updatedAt,
    dependencies: {
      database: {
        db_version: dbVersion,
        max_connections: parseInt(maxConnections, 10),
        current_connections: parseInt(currentConnections, 10),
      },
    },
  };

  const secureStatusObject = authorization.filterOutput(
    userTryingToGet,
    "read:status",
    statusObject,
  );

  return response.status(200).json(secureStatusObject);
}
