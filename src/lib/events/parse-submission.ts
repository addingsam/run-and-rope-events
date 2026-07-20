import type {
  BatchEventEntry,
  EventSubmission,
  RodeoLevel,
  SubmissionDiscipline,
  SubmissionFormat,
  SubmissionSource,
} from "@/types/event-submission";

function trimString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function rawString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function trimStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function getString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getRawString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function parseSubmissionSource(value: unknown): SubmissionSource {
  return trimString(value) === "scrape" ? "scrape" : "flyer";
}

function normalizeBatchEventEntry(item: unknown): BatchEventEntry | null {
  if (typeof item !== "object" || item === null) {
    return null;
  }

  const event = item as Record<string, unknown>;
  const normalized = {
    startDate: trimString(event.startDate),
    endDate: trimString(event.endDate),
    entryDeadline: trimString(event.entryDeadline),
    venueName: trimString(event.venueName),
    streetAddress: trimString(event.streetAddress),
    city: trimString(event.city),
    state: trimString(event.state),
    zipCode: trimString(event.zipCode),
  } satisfies BatchEventEntry;

  if (
    !normalized.startDate &&
    !normalized.endDate &&
    !normalized.venueName &&
    !normalized.city &&
    !normalized.state
  ) {
    return null;
  }

  return normalized;
}

export function normalizeBatchEvents(raw: unknown): BatchEventEntry[] {
  if (typeof raw === "string") {
    if (!raw.trim()) {
      return [];
    }

    try {
      return normalizeBatchEvents(JSON.parse(raw) as unknown);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => normalizeBatchEventEntry(item))
    .filter((event): event is BatchEventEntry => event !== null);
}

export function normalizeBatchEventDates(raw: unknown): string[] {
  return trimStringArray(raw);
}

export interface ParsedSubmissionRequest {
  submission: EventSubmission;
  batchEvents: BatchEventEntry[];
  batchEventDates: string[];
}

export async function parseSubmissionRequest(
  request: Request,
  options?: { source?: SubmissionSource },
): Promise<ParsedSubmissionRequest> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    const submission = parseSubmissionJson(body, options);
    return {
      submission,
      batchEvents: normalizeBatchEvents(body.batchEvents),
      batchEventDates: normalizeBatchEventDates(body.eventDates),
    };
  }

  const formData = await request.formData().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Invalid submission request.";
    throw new Error(
      message.includes("FormData")
        ? "Submission failed to send. Refresh the page and try again."
        : message,
    );
  });

  return {
    submission: parseSubmissionFormData(formData, options),
    batchEvents: parseBatchEvents(formData),
    batchEventDates: parseBatchEventDates(formData),
  };
}

function parseSubmissionJson(
  body: Record<string, unknown>,
  options?: { source?: SubmissionSource },
): EventSubmission {
  return {
    eventName: trimString(body.eventName),
    format: trimString(body.format) as SubmissionFormat,
    rodeoLevels: trimStringArray(body.rodeoLevels) as RodeoLevel[],
    disciplines: trimStringArray(body.disciplines) as SubmissionDiscipline[],
    additionalOfferings: trimStringArray(body.additionalOfferings),
    startDate: trimString(body.startDate),
    endDate: trimString(body.endDate),
    entryDeadline: trimString(body.entryDeadline),
    classDivisionInfo: trimString(body.classDivisionInfo),
    venueName: trimString(body.venueName),
    streetAddress: trimString(body.streetAddress),
    city: trimString(body.city),
    state: trimString(body.state),
    zipCode: trimString(body.zipCode),
    producerName: trimString(body.producerName),
    producerWebsite: trimString(body.producerWebsite),
    contactEmail: trimString(body.contactEmail),
    contactPhone: trimString(body.contactPhone),
    entryFee: rawString(body.entryFee),
    prizePayoutInfo: trimString(body.prizePayoutInfo),
    description: trimString(body.description),
    submitterEmail: trimString(body.submitterEmail),
    flyerUrl: trimString(body.flyerUrl),
    source: options?.source ?? parseSubmissionSource(body.source),
  };
}

export function parseBatchEventDates(formData: FormData): string[] {
  return formData
    .getAll("eventDates")
    .map((value) => getString(value))
    .filter(Boolean);
}

export function parseBatchEvents(formData: FormData): BatchEventEntry[] {
  return normalizeBatchEvents(getString(formData.get("batchEvents")));
}

export function parseSubmissionFormData(
  formData: FormData,
  options?: { source?: SubmissionSource },
): EventSubmission {
  return {
    eventName: getString(formData.get("eventName")),
    format: getString(formData.get("format")) as SubmissionFormat,
    rodeoLevels: formData
      .getAll("rodeoLevels")
      .map((value) => getString(value))
      .filter(Boolean) as RodeoLevel[],
    disciplines: formData
      .getAll("disciplines")
      .map((value) => getString(value))
      .filter(Boolean) as SubmissionDiscipline[],
    additionalOfferings: formData
      .getAll("additionalOfferings")
      .map((value) => getString(value))
      .filter(Boolean),
    startDate: getString(formData.get("startDate")),
    endDate: getString(formData.get("endDate")),
    entryDeadline: getString(formData.get("entryDeadline")),
    classDivisionInfo: getString(formData.get("classDivisionInfo")),
    venueName: getString(formData.get("venueName")),
    streetAddress: getString(formData.get("streetAddress")),
    city: getString(formData.get("city")),
    state: getString(formData.get("state")),
    zipCode: getString(formData.get("zipCode")),
    producerName: getString(formData.get("producerName")),
    producerWebsite: getString(formData.get("producerWebsite")),
    contactEmail: getString(formData.get("contactEmail")),
    contactPhone: getString(formData.get("contactPhone")),
    entryFee: getRawString(formData.get("entryFee")),
    prizePayoutInfo: getString(formData.get("prizePayoutInfo")),
    description: getString(formData.get("description")),
    submitterEmail: getString(formData.get("submitterEmail")),
    flyerUrl: getString(formData.get("flyerUrl")),
    source: options?.source ?? parseSubmissionSource(formData.get("source")),
  };
}
