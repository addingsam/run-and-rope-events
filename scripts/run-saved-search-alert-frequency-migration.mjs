#!/usr/bin/env node
/**
 * Add alert_frequency + last_alert_sent_at to saved_searches.
 *
 * Usage:
 *   node scripts/run-saved-search-alert-frequency-migration.mjs
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
      "  node scripts/run-saved-search-alert-frequency-migration.mjs\n\n" +
      "Or paste scripts/apply-saved-search-alert-frequency.sql into the Supabase SQL Editor and run it there.",
  );
  process.exit(1);
}

const sql = readFileSync(
  join(root, "scripts/apply-saved-search-alert-frequency.sql"),
  "utf8",
);

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Running saved search alert_frequency migration...");
  await client.query(sql);
  const { rows } = await client.query(
    `select column_name, data_type, is_nullable
     from information_schema.columns
     where table_schema = 'public'
       and table_name = 'saved_searches'
       and column_name in ('alert_frequency', 'last_alert_sent_at')
     order by column_name`,
  );
  console.log("Migration complete. Columns:");
  for (const row of rows) {
    console.log(`  saved_searches.${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
  }
  if (rows.length < 2) {
    console.error("Expected 2 columns; verify migration in Supabase dashboard.");
    process.exit(1);
  }
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
