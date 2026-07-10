"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { deleteProRodeo, getProRodeoById } from "@/lib/pro-rodeos/repository";
import {
  createProRodeoListing,
  updateProRodeoListing,
} from "@/lib/pro-rodeos/save-pro-rodeo";
import type { ProRodeoInput } from "@/types/pro-rodeo-form";
import type { ProRodeoRecord } from "@/types/pro-rodeo-record";

export async function createProRodeoAction(input: ProRodeoInput) {
  await requireAdminUser();
  const result = await createProRodeoListing(input);
  revalidatePath("/admin");
  return result;
}

export async function updateProRodeoAction(id: string, input: ProRodeoInput) {
  await requireAdminUser();
  const result = await updateProRodeoListing(id, input);
  revalidatePath("/admin");
  return result;
}

export async function deleteProRodeoAction(id: string) {
  await requireAdminUser();
  await deleteProRodeo(id);
  revalidatePath("/admin");
}

export async function getProRodeoForEditAction(id: string): Promise<ProRodeoInput> {
  await requireAdminUser();
  const record = await getProRodeoById(id);
  return mapProRodeoRecordToInput(record);
}

function mapProRodeoRecordToInput(record: ProRodeoRecord): ProRodeoInput {
  return {
    rodeoName: record.rodeo_name,
    sanctioningBody: record.sanctioning_body,
    city: record.city,
    state: record.state,
    startDate: record.start_date,
    endDate: record.end_date ?? "",
    externalLink: record.external_link,
  };
}
