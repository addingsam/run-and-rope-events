import { geocodeCityState } from "@/lib/geocoding/geocode-city-state";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { ProRodeoFormInput } from "@/types/pro-rodeo-form";
import type { ProRodeoRecordInsert } from "@/types/pro-rodeo-record";

function verifyAdminPassword(password: string) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return true;
  }

  return password === adminSecret;
}

function toNullableDate(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function saveProRodeoListing(input: ProRodeoFormInput) {
  if (!verifyAdminPassword(input.adminPassword)) {
    throw new Error("Invalid admin password.");
  }

  if (!input.rodeoName.trim()) {
    throw new Error("Rodeo name is required.");
  }

  if (!input.city.trim() || !input.state.trim()) {
    throw new Error("City and state are required.");
  }

  if (!input.startDate) {
    throw new Error("Start date is required.");
  }

  if (!input.externalLink.trim()) {
    throw new Error("External link is required.");
  }

  if (!/^https?:\/\/.+/i.test(input.externalLink.trim())) {
    throw new Error("External link must be a valid URL.");
  }

  if (input.endDate && input.endDate < input.startDate) {
    throw new Error("End date must be on or after the start date.");
  }

  const { latitude, longitude } = await geocodeCityState(input.city, input.state);

  const record: ProRodeoRecordInsert = {
    rodeo_name: input.rodeoName.trim(),
    sanctioning_body: input.sanctioningBody,
    city: input.city.trim(),
    state: input.state.trim(),
    start_date: input.startDate,
    end_date: toNullableDate(input.endDate),
    latitude,
    longitude,
    external_link: input.externalLink.trim(),
  };

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pro_rodeos")
    .insert(record)
    .select("id, rodeo_name")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
