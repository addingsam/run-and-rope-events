import type {
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
