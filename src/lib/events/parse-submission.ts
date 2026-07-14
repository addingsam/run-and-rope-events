import type {
  BatchEventEntry,
  EventSubmission,
  RodeoLevel,
  SubmissionDiscipline,
  SubmissionFormat,
  SubmissionSource,
} from "@/types/event-submission";

function getString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getRawString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function parseSubmissionSource(value: FormDataEntryValue | null): SubmissionSource {
  return getString(value) === "scrape" ? "scrape" : "flyer";
}

export function parseBatchEventDates(formData: FormData): string[] {
  return formData
    .getAll("eventDates")
    .map((value) => getString(value))
    .filter(Boolean);
}

export function parseBatchEvents(formData: FormData): BatchEventEntry[] {
  const raw = getString(formData.get("batchEvents"));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (typeof item !== "object" || item === null) {
          return null;
        }

        const event = item as Record<string, unknown>;
        return {
          startDate: typeof event.startDate === "string" ? event.startDate.trim() : "",
          endDate: typeof event.endDate === "string" ? event.endDate.trim() : "",
          venueName: typeof event.venueName === "string" ? event.venueName.trim() : "",
          streetAddress:
            typeof event.streetAddress === "string" ? event.streetAddress.trim() : "",
          city: typeof event.city === "string" ? event.city.trim() : "",
          state: typeof event.state === "string" ? event.state.trim() : "",
          zipCode: typeof event.zipCode === "string" ? event.zipCode.trim() : "",
        } satisfies BatchEventEntry;
      })
      .filter((event): event is BatchEventEntry => event !== null)
      .filter(
        (event) =>
          event.startDate ||
          event.endDate ||
          event.venueName ||
          event.city ||
          event.state,
      );
  } catch {
    return [];
  }
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
