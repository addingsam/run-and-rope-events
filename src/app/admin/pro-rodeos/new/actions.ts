"use server";

import { revalidatePath } from "next/cache";
import { saveProRodeoListing } from "@/lib/pro-rodeos/save-pro-rodeo";
import type { ProRodeoFormInput } from "@/types/pro-rodeo-form";

export async function createProRodeoListing(input: ProRodeoFormInput) {
  try {
    const result = await saveProRodeoListing(input);
    revalidatePath("/admin");
    return {
      success: true as const,
      message: `"${result.rodeo_name}" was added to pro_rodeos.`,
      id: result.id,
    };
  } catch (error) {
    return {
      success: false as const,
      message: error instanceof Error ? error.message : "Failed to save pro rodeo.",
    };
  }
}
