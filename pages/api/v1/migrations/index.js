import migrationRunner from 'node-pg-migrate';
import { join } from 'node:path';

export default async function migrations(request, response) {

  const defaultMigrationRunnerOptions = {
      databaseUrl: process.env.DATABASE_URL,
      dir: join("infra", "migrations"),
      direction: 'up',
      verbose: true,
      migrationsTable: 'pgmigrations',
      dryRun: true,
    }
  
  if (request.method === "GET") {
    const pendingMigrations = await migrationRunner(defaultMigrationRunnerOptions);
    return response.status(200).json(pendingMigrations);
  }

  if (request.method === "POST") {
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationRunnerOptions,
      dryRun: false
    });

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
  }

  response.status(405).json({ error: "Method not allowed" });
}