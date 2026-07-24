import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { CalendarEntryInput, CalendarEntryRecord } from "@/types/calendar-entry";

function mapRow(row: Record<string, unknown>): CalendarEntryRecord {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    title: row.title as string,
    entry_date: row.entry_date as string,
    entry_time: (row.entry_time as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listCalendarEntries(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("calendar_entries")
    .select("id, user_id, title, entry_date, entry_time, note, created_at, updated_at")
    .eq("user_id", userId)
    .order("entry_date", { ascending: true })
    .order("entry_time", { ascending: true, nullsFirst: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapRow);
}

export async function createCalendarEntry(userId: string, input: CalendarEntryInput) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("calendar_entries")
    .insert({
      user_id: userId,
      title: input.title.trim(),
      entry_date: input.entry_date,
      entry_time: input.entry_time?.trim() || null,
      note: input.note?.trim() || null,
    })
    .select("id, user_id, title, entry_date, entry_time, note, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRow(data);
}

export async function updateCalendarEntry(
  userId: string,
  entryId: string,
  input: CalendarEntryInput,
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("calendar_entries")
    .update({
      title: input.title.trim(),
      entry_date: input.entry_date,
      entry_time: input.entry_time?.trim() || null,
      note: input.note?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", entryId)
    .select("id, user_id, title, entry_date, entry_time, note, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRow(data);
}

export async function deleteCalendarEntry(userId: string, entryId: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("calendar_entries")
    .delete()
    .eq("user_id", userId)
    .eq("id", entryId);

  if (error) {
    throw new Error(error.message);
  }
}
