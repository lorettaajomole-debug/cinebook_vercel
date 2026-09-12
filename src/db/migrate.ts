import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index";
import path from "path";

async function runMigrations() {
  console.log("🚀 [Database Engine Agent] Starting CineBook database migrations...");
  const startTime = Date.now();

  try {
    const migrationsFolder = path.resolve(process.cwd(), "src/db/migrations");
    await migrate(db, { migrationsFolder });
    console.log(`✅ [Database Engine Agent] Migrations applied successfully in ${Date.now() - startTime}ms!`);
  } catch (error) {
    console.error("❌ [Database Engine Agent] Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
