/**
 * Pre-launch smoke test: approve test events and verify search logic.
 * Run: node --env-file=.env.local scripts/e2e-smoke-test.mjs
 */
import { createClient } from "@supabase/supabase-js";

const JACKPOT_ID = "bfc16510-4bbc-47dd-bc26-22b52505100e";
const RODEO_ID = "38501378-0d1a-4803-b84b-9352574f8ad0";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function approveEvent(id) {
  const { data, error } = await supabase
    .from("events")
    .update({ status: "approved" })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`Approve ${id}: ${error.message}`);
  return data;
}

async function getEvent(id) {
  const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
  if (error) throw new Error(`Get ${id}: ${error.message}`);
  return data;
}

async function searchNearby({ lat, lng, radiusMiles, format, rodeoLevel }) {
  const { data, error } = await supabase.rpc("nearby_events", {
    search_lat: lat,
    search_lng: lng,
    radius_miles: radiusMiles,
    filter_event_format: format === "either" ? null : format,
    filter_rodeo_level: rodeoLevel || null,
    filter_disciplines: null,
  });

  if (error) throw new Error(`Nearby search: ${error.message}`);
  return data ?? [];
}

async function main() {
  console.log("=== E2E smoke test ===\n");

  // 1. Approve both submissions
  const jackpot = await approveEvent(JACKPOT_ID);
  const rodeo = await approveEvent(RODEO_ID);

  assert(jackpot.status === "approved", "Jackpot approved");
  assert(rodeo.status === "approved", "Rodeo approved");
  assert(jackpot.event_format === "jackpot", "Jackpot format stored");
  assert(rodeo.event_format === "rodeo", "Rodeo format stored");
  assert(rodeo.rodeo_level === "open", "Rodeo level stored");
  assert(rodeo.disciplines?.length >= 3, "Rodeo has multiple disciplines");

  assert(jackpot.latitude != null && jackpot.longitude != null, "Jackpot geocoded");
  assert(rodeo.latitude != null && rodeo.longitude != null, "Rodeo geocoded");

  // 2. Radius search near Austin for jackpot
  const austinResults = await searchNearby({
    lat: jackpot.latitude,
    lng: jackpot.longitude,
    radiusMiles: 50,
    format: "jackpot",
    rodeoLevel: "",
  });
  const foundJackpot = austinResults.some((e) => e.id === JACKPOT_ID);
  assert(foundJackpot, "Jackpot found in radius search near Austin");

  // 3. Radius search near Fort Worth for open rodeo
  const fwResults = await searchNearby({
    lat: rodeo.latitude,
    lng: rodeo.longitude,
    radiusMiles: 50,
    format: "rodeo",
    rodeoLevel: "open",
  });
  const foundRodeo = fwResults.some((e) => e.id === RODEO_ID);
  assert(foundRodeo, "Open rodeo found in radius search near Fort Worth");

  // 4. Discipline filter should include rodeo when matching
  const { data: disciplineResults, error: discError } = await supabase.rpc("nearby_events", {
    search_lat: rodeo.latitude,
    search_lng: rodeo.longitude,
    radius_miles: 50,
    filter_event_format: "rodeo",
    filter_rodeo_level: "open",
    filter_disciplines: ["barrel_racing", "team_roping"],
  });
  if (discError) throw new Error(`Discipline search: ${discError.message}`);
  assert(
    (disciplineResults ?? []).some((e) => e.id === RODEO_ID),
    "Rodeo found with discipline filter",
  );

  // 5. Pending events should NOT appear in search
  const { data: pendingCheck } = await supabase
    .from("events")
    .select("id")
    .eq("status", "pending")
    .limit(1);
  if (pendingCheck?.length) {
    const pendingId = pendingCheck[0].id;
    const pendingInSearch = austinResults.some((e) => e.id === pendingId);
    assert(!pendingInSearch, "Pending events excluded from search");
  } else {
    console.log("SKIP: No pending events to verify exclusion");
  }

  console.log("\n=== All smoke tests passed ===");

  // 6. Route search Austin -> Fort Worth
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!mapboxToken) {
    console.log("SKIP: Route search (no MAPBOX_ACCESS_TOKEN)");
    return;
  }

  const origin = { lat: jackpot.latitude, lng: jackpot.longitude };
  const destination = { lat: rodeo.latitude, lng: rodeo.longitude };
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const directionsRes = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&access_token=${mapboxToken}`,
  );
  if (!directionsRes.ok) throw new Error("Mapbox Directions failed");
  const directions = await directionsRes.json();
  const routeCoords = directions.routes?.[0]?.geometry?.coordinates ?? [];
  assert(routeCoords.length > 0, "Mapbox returned route coordinates");

  const route = routeCoords.map(([lng, lat]) => ({ lat, lng }));
  const route_lats = route.map((p) => p.lat);
  const route_lngs = route.map((p) => p.lng);

  const { data: alongRoute, error: routeError } = await supabase.rpc("events_along_route", {
    route_lats,
    route_lngs,
    buffer_miles: 25,
    filter_event_format: null,
    filter_rodeo_level: null,
    filter_disciplines: null,
  });
  if (routeError) throw new Error(`Route search: ${routeError.message}`);

  const routeIds = (alongRoute ?? []).map((e) => e.id);
  assert(routeIds.includes(JACKPOT_ID), "Jackpot found along Austin→Fort Worth route");
  assert(routeIds.includes(RODEO_ID), "Rodeo found along Austin→Fort Worth route");

  console.log("\n=== Route search tests passed ===");
}

main().catch((err) => {
  console.error("\n" + err.message);
  process.exit(1);
});
