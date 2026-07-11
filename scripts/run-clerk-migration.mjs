#!/usr/bin/env node
/**
 * Run the Clerk user_id text migration against Supabase.
 *
 * Usage:
 *   node scripts/run-clerk-migration.mjs
 *
 * Requires one of these in .env.local:
 *   DATABASE_URL=postgresql://postgres:...@db.<ref>.supabase.co:5432/postgres
 *   SUPABASE_DB_PASSWORD=<database password>  (with SUPABASE_URL set)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const { Client } = pg;
const root = dirname(dirname(fileURLToPath(import.meta.url)));

function loadEnvLocal() {
  try {
    return Object.fromEntries(
      readFileSync(join(root, ".env.local"), "utf8")
        .split("\n")
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          const index = line.indexOf("=");
          return [line.slice(0, index), line.slice(index + 1)];
        }),
    );
  } catch {
    return {};
  }
}

function getDatabaseUrl(env) {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  const ref = env.SUPABASE_URL?.replace("https://", "").replace(".supabase.co", "");
  const password = env.SUPABASE_DB_PASSWORD;
  if (!ref || !password) {
    return null;
  }

  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

const env = { ...process.env, ...loadEnvLocal() };
const databaseUrl = getDatabaseUrl(env);

if (!databaseUrl) {
  console.error(
    "Missing DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local.\n" +
      "Add your Supabase database password, then rerun:\n" +
      "  node scripts/run-clerk-migration.mjs\n\n" +
      "Or paste scripts/apply-clerk-text-user-ids.sql into the Supabase SQL Editor and run it there.",
  );
  process.exit(1);
}

const sql = readFileSync(
  join(root, "scripts/apply-clerk-text-user-ids.sql"),
  "utf8",
);

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Running Clerk text user_id migration...");
  await client.query(sql);
  const { rows } = await client.query(
    `select table_name, column_name, data_type
     from information_schema.columns
     where table_schema = 'public'
       and table_name in ('profiles', 'saved_searches', 'saved_events')
       and column_name in ('id', 'user_id')
     order by table_name, column_name`,
  );
  console.log("Migration complete. Column types:");
  for (const row of rows) {
    console.log(`  ${row.table_name}.${row.column_name}: ${row.data_type}`);
  }
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
