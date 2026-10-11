// Run a SQL migration file against DATABASE_URL. Usage:
//   DATABASE_URL=... pnpm --filter @ole/api exec tsx scripts/run-migration.mts migrations/001_projects.sql
import { readFileSync } from "node:fs";
import pg from "pg";

const file = process.argv[2];
if (!file) { console.error("usage: run-migration.mts <sql-file>"); process.exit(1); }
if (!process.env.DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = readFileSync(file, "utf8");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query(sql);
  const cols = await client.query(
    "select column_name, data_type from information_schema.columns where table_name = 'projects' order by ordinal_position",
  );
  const pols = await client.query("select policyname from pg_policies where tablename = 'projects'");
  console.log("projects columns:", cols.rows.map((r) => `${r.column_name}:${r.data_type}`).join(", "));
  console.log("RLS policies:", pols.rows.map((r) => r.policyname).join(", "));
  console.log(`migration OK: ${file}`);
} catch (e) {
  console.error("migration failed:", (e as Error).message);
  process.exit(1);
} finally {
  await client.end();
}
