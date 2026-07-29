#!/usr/bin/env node
/**
 * Backfill rodeo_level = ranch for events whose text references ranch rodeo.
 *
 * Usage:
 *   node scripts/backfill-ranch-rodeo-levels.mjs
 *   node scripts/backfill-ranch-rodeo-levels.mjs --dry-run
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dryRun = process.argv.includes("--dry-run");

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
      "Paste scripts/apply-ranch-rodeo-backfill.sql into the Supabase SQL Editor instead.",
  );
  process.exit(1);
}

const previewSql = `
  select id, event_name, rodeo_level, status
  from public.events
  where event_format = 'rodeo'
    and coalesce(rodeo_level, '') not like '%ranch%'
    and (
      event_name ~* '\\\\mranch rodeos?\\\\M'
      or coalesce(description, '') ~* '\\\\mranch rodeos?\\\\M'
      or coalesce(event_name, '') ~* '\\\\mranch-rodeo\\\\M'
      or coalesce(description, '') ~* '\\\\mranch-rodeo\\\\M'
    )
  order by event_date desc
`;

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const { rows } = await client.query(previewSql);
  console.log(`${rows.length} rodeo event(s) to recategorize as ranch:`);
  for (const row of rows) {
    console.log(`  - ${row.event_name} (${row.id}) [${row.status}] was: ${row.rodeo_level ?? "(none)"}`);
  }

  if (dryRun || rows.length === 0) {
    process.exit(0);
  }

  const sql = readFileSync(join(root, "scripts/apply-ranch-rodeo-backfill.sql"), "utf8");
  const result = await client.query(sql);
  console.log(`Updated ${result.rowCount ?? 0} event(s) to rodeo_level = ranch.`);
} catch (error) {
  console.error("Backfill failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
