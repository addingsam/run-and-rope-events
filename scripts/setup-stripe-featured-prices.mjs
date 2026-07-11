#!/usr/bin/env node
/**
 * Create Stripe prices for homepage featuring and print env lines to add.
 * Usage: node scripts/setup-stripe-featured-prices.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import Stripe from "stripe";

function loadEnvLocal() {
  const lines = readFileSync(".env.local", "utf8").split("\n");
  const env = Object.fromEntries(
    lines
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
  return { lines, env };
}

function upsertEnvLines(lines, entries) {
  const next = [...lines];
  for (const [key, value] of entries) {
    const index = next.findIndex((line) => line.startsWith(`${key}=`));
    const formatted = `${key}=${value}`;
    if (index >= 0) {
      next[index] = formatted;
    } else {
      if (next.length > 0 && next[next.length - 1] !== "") {
        next.push("");
      }
      next.push("# Stripe featured placement ($15 / 30 days)");
      next.push(formatted);
    }
  }
  return next.join("\n").replace(/\n?$/, "\n");
}

const { lines, env } = loadEnvLocal();
const secretKey = env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.error("Missing STRIPE_SECRET_KEY in .env.local");
  process.exit(1);
}

if (env.STRIPE_PRICE_FEATURED_ID && env.STRIPE_PRICE_FEATURED_RECURRING_ID) {
  console.log("Featured Stripe price IDs already configured:");
  console.log(`STRIPE_PRICE_FEATURED_ID=${env.STRIPE_PRICE_FEATURED_ID}`);
  console.log(`STRIPE_PRICE_FEATURED_RECURRING_ID=${env.STRIPE_PRICE_FEATURED_RECURRING_ID}`);
  process.exit(0);
}

const stripe = new Stripe(secretKey);

const product = await stripe.products.create({
  name: "Homepage Featured Placement",
  description: "Featured placement on the Jackpot & Rodeo Events homepage for 30 days",
});

const oneTime = await stripe.prices.create({
  product: product.id,
  unit_amount: 1500,
  currency: "usd",
  nickname: "Featured placement - one-time 30 days",
});

const recurring = await stripe.prices.create({
  product: product.id,
  unit_amount: 1500,
  currency: "usd",
  recurring: { interval: "month", interval_count: 1 },
  nickname: "Featured placement - every 30 days",
});

const updated = upsertEnvLines(lines, [
  ["STRIPE_PRICE_FEATURED_ID", oneTime.id],
  ["STRIPE_PRICE_FEATURED_RECURRING_ID", recurring.id],
]);

writeFileSync(".env.local", updated);

console.log("Added featured Stripe prices to .env.local:");
console.log(`STRIPE_PRICE_FEATURED_ID=${oneTime.id}`);
console.log(`STRIPE_PRICE_FEATURED_RECURRING_ID=${recurring.id}`);
