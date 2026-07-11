#!/usr/bin/env node
/**
 * Apply featured column migration and optionally sync a Stripe checkout session.
 *
 * Usage:
 *   node scripts/fix-featured-placement.mjs
 *   node scripts/fix-featured-placement.mjs --session cs_test_...
 */
import { readFileSync } from "node:fs";
import pg from "pg";
import Stripe from "stripe";

const { Client } = pg;

function loadEnv() {
  return Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split("\n")
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
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

const sessionArg = process.argv.find((arg) => arg.startsWith("cs_"));
const env = loadEnv();
const databaseUrl = getDatabaseUrl(env);

if (!databaseUrl) {
  console.error(
    "Missing DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local. Run scripts/apply-featured-columns.sql in the Supabase SQL editor instead.",
  );
  process.exit(1);
}

const sql = readFileSync("scripts/apply-featured-columns.sql", "utf8");
const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(sql);
console.log("Featured columns migration applied.");

if (sessionArg && env.STRIPE_SECRET_KEY) {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(sessionArg);
  const eventId = session.metadata?.event_id;
  const paidAt = new Date(session.created * 1000).toISOString();
  const until = new Date(session.created * 1000);
  until.setUTCDate(until.getUTCDate() + 30);

  if (eventId && session.payment_status === "paid") {
    await client.query(
      `update public.events
       set featured_paid_at = $1,
           featured_until = $2,
           featured_stripe_checkout_session_id = $3,
           featured_billing_type = $4
       where id = $5`,
      [
        paidAt,
        until.toISOString(),
        session.id,
        session.mode === "subscription" ? "recurring" : "one_time",
        eventId,
      ],
    );
    console.log(`Backfilled featured placement for event ${eventId}`);
  }
}

const { rows } = await client.query(
  `select event_name, status, featured_paid_at, featured_until
   from public.events
   order by created_at desc
   limit 10`,
);
console.table(rows);
await client.end();
