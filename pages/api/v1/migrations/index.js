import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database";
import { createRouter } from "next-connect";
import controller from "infra/controller.js";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const pendingMigrations = await runMigrations();
  return response.status(200).json(pendingMigrations);
}

async function postHandler(request, response) {
    const migratedMigrations = await runMigrations({ dryRun: false });
    return response.status(migratedMigrations.length > 0 ? 201 : 200).json(migratedMigrations);
}

function getMigrationsOptions(dbClient, dryRun = true) {
  return {
    dbClient,
    dir: resolve("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
    dryRun,
  };
}

async function runMigrations({ dryRun = true } = {}) {
  const dbClient = await database.getNewClient();

  try {
    return await migrationRunner(getMigrationsOptions(dbClient, dryRun));
  } finally {
    await dbClient?.end();
  }
}
