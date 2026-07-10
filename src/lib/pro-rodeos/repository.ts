import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { ProRodeoRecord } from "@/types/pro-rodeo-record";

export async function listProRodeos() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pro_rodeos")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ProRodeoRecord[];
}

export async function getProRodeoById(id: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pro_rodeos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ProRodeoRecord;
}

export async function deleteProRodeo(id: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("pro_rodeos").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
