import migrationRunner from 'node-pg-migrate';
import { join } from 'node:path';
import database from 'infra/database';

export default async function migrations(request, response) {
  const dbClient = await database.getNewClient();

  const defaultMigrationRunnerOptions = {
      dbClient: dbClient,
      dir: join("infra", "migrations"),
      direction: 'up',
      verbose: true,
      migrationsTable: 'pgmigrations',
      dryRun: true,
    }
  
  if (request.method === "GET") {
    const pendingMigrations = await migrationRunner(defaultMigrationRunnerOptions);
    await dbClient.end();
    return response.status(200).json(pendingMigrations);
  }

  if (request.method === "POST") {
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationRunnerOptions,
      dryRun: false
    });

    await dbClient.end();

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
  }

  response.status(405).json({ error: "Method not allowed" });
}