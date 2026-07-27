#!/usr/bin/env node
/**
 * Dry-run saved search alert emails against local or production.
 *
 * Usage:
 *   node scripts/run-saved-search-alert-check.mjs
 *   APP_URL=https://jackpotandrodeoevents.com node scripts/run-saved-search-alert-check.mjs
 *
 * Requires CRON_SECRET in .env.local (or env) unless hitting localhost without auth
 * (production always requires CRON_SECRET or x-vercel-cron).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

const env = { ...process.env, ...loadEnvLocal() };
const appUrl = (env.NEXT_PUBLIC_APP_URL ?? env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const cronSecret = env.CRON_SECRET?.trim();
const url = `${appUrl}/api/cron/notifications?dryRun=1`;

const headers = {};
if (cronSecret) {
  headers.Authorization = `Bearer ${cronSecret}`;
}

console.log(`Dry-running saved search alerts at ${url}`);

const response = await fetch(url, { headers });
const body = await response.json().catch(() => null);

if (!response.ok) {
  console.error(`Request failed (${response.status}):`, body ?? "(no JSON body)");
  if (response.status === 401) {
    console.error("\nSet CRON_SECRET in .env.local and rerun, or trigger from Vercel cron logs.");
  }
  process.exit(1);
}

console.log(JSON.stringify(body, null, 2));

const searchAlerts = body?.searchAlerts;
if (!searchAlerts) {
  process.exit(0);
}

console.log("\nSummary:");
console.log(`  Checked (due): ${searchAlerts.checked}`);
console.log(`  Would send: ${searchAlerts.wouldSend?.length ?? 0}`);
console.log(`  Skipped (not due): ${searchAlerts.skippedNotDue}`);
console.log(`  Skipped (no new events): ${searchAlerts.skippedNoNewEvents}`);
console.log(`  Skipped (no profile email): ${searchAlerts.skippedNoEmail}`);
console.log(`  Errors: ${searchAlerts.errors?.length ?? 0}`);

if (searchAlerts.wouldSend?.length) {
  console.log("\nWould send:");
  for (const item of searchAlerts.wouldSend) {
    console.log(
      `  - ${item.searchName} (${item.frequency}) → ${item.email}: ${item.newEventCount} new event(s)`,
    );
  }
}

if (searchAlerts.errors?.length) {
  console.log("\nErrors:");
  for (const item of searchAlerts.errors) {
    console.log(`  - ${item.searchName}: ${item.message}`);
  }
  process.exit(1);
}
