"use server";

import { revalidatePath } from "next/cache";
import {
  getEventByIdForAdmin,
  updateEventFromSubmission,
  updateEventStatus,
} from "@/lib/events/admin-repository";
import { mapEventRecordToSubmission } from "@/lib/events/map-record-to-submission";
import { requireAdminUser } from "@/lib/auth/require-admin";
import type { EventSubmission } from "@/types/event-submission";

export async function approveEventAction(eventId: string) {
  await requireAdminUser();
  await updateEventStatus(eventId, "approved");
  revalidatePath("/admin");
  revalidatePath("/events");
}

export async function rejectEventAction(eventId: string) {
  await requireAdminUser();
  await updateEventStatus(eventId, "rejected");
  revalidatePath("/admin");
}

export async function updateEventAction(eventId: string, submission: EventSubmission) {
  await requireAdminUser();
  await updateEventFromSubmission(eventId, submission);
  revalidatePath("/admin");
  revalidatePath("/events");
}

export async function updateAndApproveEventAction(
  eventId: string,
  submission: EventSubmission,
) {
  await requireAdminUser();
  await updateEventFromSubmission(eventId, submission);
  await updateEventStatus(eventId, "approved");
  revalidatePath("/admin");
  revalidatePath("/events");
}

export async function getEventForEditAction(eventId: string) {
  await requireAdminUser();
  const record = await getEventByIdForAdmin(eventId);
  return mapEventRecordToSubmission(record);
}
