import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database";

function getMigrationsOptions(dbClient, dryRun) {
  return {
    dbClient,
    dir: resolve("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
    dryRun,
  };
}

async function listPendingMigrations({ dryRun = true } = {}) {
  const dbClient = await database.getNewClient();

  try {
    return await migrationRunner(getMigrationsOptions(dbClient, dryRun));
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations({ dryRun = false } = {}) {
  const dbClient = await database.getNewClient();

  try {
    return await migrationRunner(getMigrationsOptions(dbClient, dryRun));
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
