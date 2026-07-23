"use client";

import { useEffect, useRef, useState } from "react";
import { BatchEventDatesField } from "@/components/submit/BatchEventDatesField";
import { BatchEventsField } from "@/components/submit/BatchEventsField";
import {
  BatchSubmissionSummary,
  getBatchSubmissionCount,
} from "@/components/submit/BatchSubmissionSummary";
import { FormSection } from "@/components/submit/FormSection";
import { AdditionalOfferingsField } from "@/components/submit/AdditionalOfferingsField";
import {
  FeaturedPlacementField,
  type FeaturedPlacementChoice,
} from "@/components/submit/FeaturedPlacementField";
import { CheckboxGroup, DateInput, OptionalDateInput, SelectInput, TextArea, TextInput } from "@/components/submit/FormField";
import {
  DISCIPLINE_OPTIONS,
  filterDisciplinesForFormat,
  FORMAT_OPTIONS,
  getDisciplineOptionsForFormat,
  resolveFormatFromDisciplines,
  RODEO_LEVEL_OPTIONS,
} from "@/lib/events/submission-options";
import {
  getProducerNameLabel,
  getProducerNameHint,
  getProducerSectionDescription,
  getProducerSectionTitle,
  getProducerWebsiteLabel,
} from "@/lib/events/producer-labels";
import {
  applyFlyerExtractionToSubmission,
  countPopulatedFlyerFields,
  EMPTY_FLYER_INFERRED_YEAR_FIELDS,
  sanitizeContactPhoneInputValue,
  type FlyerInferredYearFields,
} from "@/lib/flyer/apply-flyer-extraction";
import { coerceFlyerExtractionResult } from "@/lib/flyer/parse-flyer-extraction";
import { sanitizeFlyerExtractionLocation } from "@/lib/flyer/sanitize-flyer-location";
import {
  FLYER_ACCEPT_ATTRIBUTE,
  validateFlyerFile,
} from "@/lib/flyer/constants";
import { createFlyerUploadPayload } from "@/lib/flyer/flyer-file-name";
import { uploadFlyerFromClient } from "@/lib/flyer/upload-flyer-from-client";
import { commitDateInputValue } from "@/lib/flyer/normalize-flyer-date";
import { US_STATES } from "@/lib/us-states";
import {
  themeMutedTextClassName,
  themePanelClassName,
  themePrimaryButtonClassName,
  themeSecondaryButtonClassName,
} from "@/lib/theme/form-classes";
import type {
  FlyerExtractionLayoutType,
  FlyerExtractionResult,
} from "@/types/flyer-extraction";
import {
  estimateSubmissionPayloadBytes,
  slimBatchEventsForTransport,
  slimEventSubmissionForTransport,
  VERCEL_REQUEST_BODY_LIMIT_BYTES,
} from "@/lib/events/slim-submission-payload";
import { validateEventSubmission } from "@/lib/events/validate-submission";
import { validateBatchEventDates } from "@/lib/events/validate-batch-dates";
import { validateBatchEvents } from "@/lib/events/validate-batch-events";
import { uniqueSortedEventDates } from "@/lib/events/expand-batch-submissions";
import {
  getSubmissionDuplicateStatusLabel,
  type ScheduleDuplicateWarning,
  type SubmissionDuplicateWarning,
} from "@/lib/events/duplicate-detection";
import { formatEventDate } from "@/lib/events/format-date";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import {
  EMPTY_EVENT_SUBMISSION,
  type BatchEventEntry,
  type EventSubmission,
  type RodeoLevel,
  type SubmissionDiscipline,
  type SubmissionFormat,
} from "@/types/event-submission";

type FormErrors = Partial<
  Record<
    | keyof EventSubmission
    | "flyer"
    | "disciplines"
    | "featurePlacement"
    | "flyerExtraction"
    | "submit"
    | "eventDates"
    | "batchEvents",
    string
  > & Record<`eventDates.${number}`, string> & Record<`batchEvents.${number}.${string}`, string>
>;

const ERROR_FIELD_ORDER: Array<keyof FormErrors> = [
  "flyer",
  "flyerExtraction",
  "eventName",
  "format",
  "rodeoLevels",
  "disciplines",
  "startDate",
  "endDate",
  "entryDeadline",
  "eventDates",
  "batchEvents",
  "venueName",
  "streetAddress",
  "city",
  "state",
  "zipCode",
  "producerName",
  "contactEmail",
  "submitterEmail",
  "producerWebsite",
  "featurePlacement",
];

function findFormErrorElement(firstKey: keyof FormErrors): HTMLElement | null {
  if (firstKey === "disciplines" || firstKey === "featurePlacement") {
    return document.getElementById(firstKey);
  }

  if (firstKey.startsWith("eventDates.")) {
    const index = firstKey.split(".")[1];
    return index ? document.getElementById(`eventDates-${index}`) : null;
  }

  const named = document.getElementsByName(String(firstKey));
  if (named[0] instanceof HTMLElement) {
    return named[0];
  }

  return document.getElementById(String(firstKey));
}

function scrollToFirstFormError(errors: FormErrors) {
  const firstKey = ERROR_FIELD_ORDER.find((key) => errors[key]);
  if (!firstKey) {
    return;
  }

  try {
    const element = findFormErrorElement(firstKey);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });

    if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
      element.focus({ preventScroll: true });
    }
  } catch {
    // Avoid Safari selector parse errors blocking submit feedback.
  }
}

function validateForm(
  data: EventSubmission,
  featurePlacement: FeaturedPlacementChoice,
  batchEventDates: string[],
  batchEvents: BatchEventEntry[],
): FormErrors {
  const errors: FormErrors = validateEventSubmission(data, "flyer");
  const isMultiEventBatch = batchEvents.length >= 2;

  if (isMultiEventBatch) {
    Object.assign(errors, validateBatchEvents(batchEvents));
    delete errors.venueName;
    delete errors.city;
    delete errors.state;
    delete errors.startDate;
    delete errors.endDate;
  } else if (batchEventDates.length >= 2) {
    Object.assign(errors, validateBatchEventDates(batchEventDates));
  }

  if (featurePlacement !== "none") {
    const email = data.submitterEmail.trim() || data.contactEmail.trim();
    if (!email) {
      errors.featurePlacement =
        "Enter a submitter or contact email to receive your Stripe receipt for featuring.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.featurePlacement = "Enter a valid email for featured placement checkout.";
    }
  }

  return errors;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function describeInferredYearDateFields(fields: FlyerInferredYearFields) {
  const labels: string[] = [];
  if (fields.startDate) labels.push("start date");
  if (fields.endDate) labels.push("end date");
  if (fields.entryDeadline) labels.push("entry deadline");

  if (labels.length <= 1) {
    return labels[0] ?? "";
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

function DuplicateSubmissionNotice({ warnings }: { warnings: SubmissionDuplicateWarning[] }) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto mt-5 max-w-lg rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-left text-sm text-amber-950">
      <p className="font-semibold">Possible duplicate detected</p>
      <p className="mt-1 leading-6 text-amber-900/90">
        Your submission was received, but it matches an existing listing with the same name, format,
        and date. Our team will review both entries.
      </p>
      <ul className="mt-3 space-y-3">
        {warnings.map((warning) => (
          <li key={`${warning.eventName}-${warning.startDate}`}>
            <p className="font-medium">
              {warning.eventName} · {formatEventDate(warning.startDate)}
            </p>
            <ul className="mt-1 space-y-1 text-amber-900/90">
              {warning.matches.map((match) => (
                <li key={match.id}>
                  Existing: {match.eventName} · {formatEventDate(match.startDate)} ·{" "}
                  {match.location} ({getSubmissionDuplicateStatusLabel(match.status)})
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EventSubmissionForm() {
  const [formData, setFormData] = useState<EventSubmission>(EMPTY_EVENT_SUBMISSION);
  const [featurePlacement, setFeaturePlacement] = useState<FeaturedPlacementChoice>("none");
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [isUploadingFlyer, setIsUploadingFlyer] = useState(false);
  const [isExtractingFlyer, setIsExtractingFlyer] = useState(false);
  const [flyerExtractionMessage, setFlyerExtractionMessage] = useState<string | null>(null);
  const [inferredYearFields, setInferredYearFields] = useState<FlyerInferredYearFields>(
    EMPTY_FLYER_INFERRED_YEAR_FIELDS,
  );
  const [batchEventDates, setBatchEventDates] = useState<string[]>([]);
  const [batchEvents, setBatchEvents] = useState<BatchEventEntry[]>([]);
  const [batchEventsYearInferred, setBatchEventsYearInferred] = useState<
    Array<{ startDate: boolean; endDate: boolean }>
  >([]);
  const [flyerLayoutType, setFlyerLayoutType] = useState<FlyerExtractionLayoutType>("single");
  const [scheduleDuplicateWarnings, setScheduleDuplicateWarnings] = useState<
    ScheduleDuplicateWarning[]
  >([]);
  const duplicateCheckRequestId = useRef(0);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submittedEventCount, setSubmittedEventCount] = useState(1);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [submittedDuplicateWarnings, setSubmittedDuplicateWarnings] = useState<
    SubmissionDuplicateWarning[]
  >([]);
  const isMultiEventBatch = batchEvents.length >= 2;
  const isSameVenueBatch = !isMultiEventBatch && batchEventDates.length >= 2;
  const isScheduleFlyer = isMultiEventBatch && flyerLayoutType === "schedule";
  const isBatchMode = isMultiEventBatch || isSameVenueBatch;

  useEffect(() => {
    if (!isMultiEventBatch) {
      setScheduleDuplicateWarnings([]);
      return;
    }

    const hasCheckableEvent = batchEvents.some(
      (event) => event.startDate.trim() && event.city.trim() && event.state.trim(),
    );
    if (!hasCheckableEvent) {
      setScheduleDuplicateWarnings([]);
      return;
    }

    const requestId = duplicateCheckRequestId.current + 1;
    duplicateCheckRequestId.current = requestId;
    const timeoutId = window.setTimeout(async () => {
      try {
        const slimSubmission = slimEventSubmissionForTransport(formData);
        const slimBatchEvents = slimBatchEventsForTransport(batchEvents);
        const response = await fetch("/api/events/submit/check-duplicates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...slimSubmission,
            batchEvents: slimBatchEvents,
          }),
        });

        const data = await parseJsonResponse<{
          locationWarnings?: ScheduleDuplicateWarning[];
          error?: string;
        }>(response, "submit");

        if (duplicateCheckRequestId.current !== requestId || !response.ok) {
          return;
        }

        setScheduleDuplicateWarnings(data.locationWarnings ?? []);
      } catch {
        if (duplicateCheckRequestId.current === requestId) {
          setScheduleDuplicateWarnings([]);
        }
      }
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [batchEvents, formData, isMultiEventBatch]);

  function startBatchMode() {
    const initialDates = formData.startDate ? [formData.startDate, ""] : ["", ""];
    setBatchEventDates(initialDates);
    setErrors((current) => {
      const next = { ...current };
      delete next.startDate;
      delete next.endDate;
      return next;
    });
  }

  function handleBatchDatesChange(dates: string[]) {
    if (dates.length < 2) {
      setBatchEventDates([]);
      setBatchEvents([]);
      setBatchEventsYearInferred([]);
      if (dates[0]?.trim()) {
        updateField("startDate", dates[0].trim());
        updateField("endDate", dates[0].trim());
      }
      return;
    }

    setBatchEvents([]);
    setBatchEventsYearInferred([]);
    setBatchEventDates(dates);
    const filledDates = uniqueSortedEventDates(dates.map((date) => date.trim()).filter(Boolean));
    if (filledDates[0]) {
      updateField("startDate", filledDates[0]);
      updateField("endDate", filledDates[0]);
    }
    setInferredYearFields((current) => ({ ...current, startDate: false, endDate: false }));
  }

  function handleBatchEventsChange(events: BatchEventEntry[]) {
    if (events.length < 2) {
      setBatchEvents([]);
      setBatchEventsYearInferred([]);
      setFlyerLayoutType("single");
      setScheduleDuplicateWarnings([]);
      const first = events[0];
      if (first) {
        updateField("startDate", first.startDate);
        updateField("endDate", first.endDate || first.startDate);
        updateField("venueName", first.venueName);
        updateField("streetAddress", first.streetAddress);
        updateField("city", first.city);
        updateField("state", first.state);
        updateField("zipCode", first.zipCode);
        if (first.entryDeadline) {
          updateField("entryDeadline", first.entryDeadline);
        }
      }
      return;
    }

    setBatchEventDates([]);
    setBatchEvents(events);
    const first = events[0];
    if (first) {
      updateField("startDate", first.startDate);
      updateField("endDate", first.endDate || first.startDate);
      updateField("venueName", first.venueName);
      updateField("streetAddress", first.streetAddress);
      updateField("city", first.city);
      updateField("state", first.state);
      updateField("zipCode", first.zipCode);
    }
    setInferredYearFields(EMPTY_FLYER_INFERRED_YEAR_FIELDS);
  }

  function mergeBatchToSingleEvent() {
    if (batchEvents.length === 0) {
      return;
    }

    const first = batchEvents[0]!;
    const classLines = batchEvents
      .map((event) => event.classDivisionInfo.trim())
      .filter(Boolean);
    const mergedClassInfo = [...new Set([formData.classDivisionInfo.trim(), ...classLines].filter(Boolean))].join(
      "\n",
    );
    const entryDeadline =
      batchEvents.map((event) => event.entryDeadline.trim()).find(Boolean) ?? formData.entryDeadline;

    setBatchEvents([]);
    setBatchEventsYearInferred([]);
    setBatchEventDates([]);
    setFlyerLayoutType("single");
    setScheduleDuplicateWarnings([]);
    setInferredYearFields(EMPTY_FLYER_INFERRED_YEAR_FIELDS);
    updateField("startDate", first.startDate);
    updateField("endDate", first.endDate || first.startDate);
    updateField("entryDeadline", entryDeadline);
    updateField("venueName", first.venueName);
    updateField("streetAddress", first.streetAddress);
    updateField("city", first.city);
    updateField("state", first.state);
    updateField("zipCode", first.zipCode);
    updateField("classDivisionInfo", mergedClassInfo);
    setErrors((current) => {
      const next = { ...current };
      delete next.batchEvents;
      for (const key of Object.keys(next)) {
        if (key.startsWith("batchEvents.")) {
          delete next[key as keyof FormErrors];
        }
      }
      return next;
    });
  }

  function mergeBatchDatesToSingleEvent() {
    const filledDates = uniqueSortedEventDates(
      batchEventDates.map((date) => date.trim()).filter(Boolean),
    );
    const primaryDate = filledDates[0] ?? formData.startDate;

    setBatchEventDates([]);
    setFlyerLayoutType("single");
    if (primaryDate) {
      updateField("startDate", primaryDate);
      updateField("endDate", primaryDate);
    }
    setErrors((current) => {
      const next = { ...current };
      delete next.eventDates;
      for (const key of Object.keys(next)) {
        if (key.startsWith("eventDates.")) {
          delete next[key as keyof FormErrors];
        }
      }
      return next;
    });
  }

  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleFormatChange(format: SubmissionFormat) {
    setFormData((current) => ({
      ...current,
      format,
      disciplines: filterDisciplinesForFormat(current.disciplines, format),
      rodeoLevels: format === "rodeo" ? current.rodeoLevels : [],
      additionalOfferings: format === "rodeo" ? current.additionalOfferings : [],
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.format;
      if (format !== "rodeo") {
        delete next.rodeoLevels;
      }
      return next;
    });
  }

  function handleDisciplinesChange(disciplines: SubmissionDiscipline[]) {
    setFormData((current) => {
      const format = resolveFormatFromDisciplines(disciplines, current.format);

      return {
        ...current,
        format,
        disciplines: filterDisciplinesForFormat(disciplines, format),
        rodeoLevels: format === "rodeo" ? current.rodeoLevels : [],
        additionalOfferings: format === "rodeo" ? current.additionalOfferings : [],
      };
    });
    setErrors((current) => {
      const next = { ...current };
      delete next.disciplines;
      delete next.format;
      delete next.rodeoLevels;
      return next;
    });
  }

  function handleRodeoLevelsChange(levels: RodeoLevel[]) {
    updateField("rodeoLevels", levels);
    setErrors((current) => {
      const next = { ...current };
      delete next.rodeoLevels;
      return next;
    });
  }

  function updateField<K extends keyof EventSubmission>(field: K, value: EventSubmission[K]) {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next.submit;
      return next;
    });
  }

  function updateDateField(field: "startDate" | "endDate" | "entryDeadline", value: string) {
    updateField(field, value);
    setInferredYearFields((current) => ({ ...current, [field]: false }));
  }

  function clearFlyer() {
    setFlyerFile(null);
    setFlyerExtractionMessage(null);
    setInferredYearFields(EMPTY_FLYER_INFERRED_YEAR_FIELDS);
    setBatchEventDates([]);
    setBatchEvents([]);
    setBatchEventsYearInferred([]);
    setFlyerLayoutType("single");
    setScheduleDuplicateWarnings([]);
    updateField("flyerUrl", "");
    updateField("entryDeadline", "");
    setErrors((current) => {
      const next = { ...current };
      delete next.flyer;
      delete next.flyerExtraction;
      delete next.format;
      delete next.submit;
      delete next.disciplines;
      return next;
    });
  }

  async function uploadFlyer(file: File) {
    const validationError = validateFlyerFile(file);
    if (validationError) {
      setErrors((current) => ({ ...current, flyer: validationError }));
      return;
    }

    setFlyerFile(file);
    setIsUploadingFlyer(true);
    setFlyerExtractionMessage(null);
    setInferredYearFields(EMPTY_FLYER_INFERRED_YEAR_FIELDS);
    setBatchEventDates([]);
    setBatchEvents([]);
    setBatchEventsYearInferred([]);
    setFlyerLayoutType("single");
    setScheduleDuplicateWarnings([]);
    updateField("flyerUrl", "");
    updateField("entryDeadline", "");
    setErrors((current) => {
      const next = { ...current };
      delete next.flyer;
      delete next.flyerExtraction;
      delete next.format;
      delete next.submit;
      delete next.disciplines;
      return next;
    });

    try {
      const { file: uploadFile, originalFileName } = createFlyerUploadPayload(file);
      const url = await uploadFlyerFromClient(uploadFile, originalFileName);

      updateField("flyerUrl", url);
      await fillFormFromFlyer(url);
    } catch (error) {
      setFlyerFile(null);
      const message = error instanceof Error ? error.message : "Flyer upload failed.";
      setErrors((current) => ({
        ...current,
        flyer:
          message.toLowerCase().includes("load failed") ||
          message.toLowerCase().includes("failed to fetch")
            ? "Flyer upload failed. Check your connection, or use a smaller file under 3.5 MB."
            : message,
      }));
    } finally {
      setIsUploadingFlyer(false);
    }
  }

  async function handleFlyerChange(file: File | null) {
    if (!file) {
      clearFlyer();
      return;
    }

    await uploadFlyer(file);
  }

  async function fillFormFromFlyer(flyerUrl = formData.flyerUrl) {
    if (!flyerUrl) {
      setErrors((current) => ({
        ...current,
        flyerExtraction: "Upload a flyer before extracting details.",
      }));
      return;
    }

    setIsExtractingFlyer(true);
    setFlyerExtractionMessage(null);
    setInferredYearFields(EMPTY_FLYER_INFERRED_YEAR_FIELDS);
    setBatchEventDates([]);
    setBatchEvents([]);
    setBatchEventsYearInferred([]);
    setFlyerLayoutType("single");
    setScheduleDuplicateWarnings([]);
    updateField("entryDeadline", "");
    setErrors((current) => {
      const next = { ...current };
      delete next.flyerExtraction;
      delete next.entryDeadline;
      return next;
    });

    try {
      const response = await fetch("/api/extract-flyer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ flyerUrl }),
      });

      const data = await parseJsonResponse<{
        extracted?: FlyerExtractionResult;
        error?: string;
      }>(response, "extract");

      if (!response.ok || !data.extracted) {
        throw new Error(data.error ?? "Could not extract details from this flyer.");
      }

      const coercedExtraction = coerceFlyerExtractionResult(data.extracted);
      const extractionResult = applyFlyerExtractionToSubmission(
        formDataRef.current,
        coercedExtraction,
      );

      if (!extractionResult?.submission) {
        throw new Error("Could not apply flyer extraction to the form.");
      }

      const batchDates = extractionResult.batchEventDates ?? [];
      const batchEventsList = extractionResult.batchEvents ?? [];

      setFormData(slimEventSubmissionForTransport(extractionResult.submission));
      setBatchEventDates(batchDates);
      setBatchEvents(slimBatchEventsForTransport(batchEventsList));
      setBatchEventsYearInferred(extractionResult.batchEventsYearInferred ?? []);
      setFlyerLayoutType(extractionResult.layoutType ?? "single");
      setScheduleDuplicateWarnings([]);
      setInferredYearFields(
        extractionResult.inferredYearFields ?? EMPTY_FLYER_INFERRED_YEAR_FIELDS,
      );
      setErrors({});

      const populatedCount = countPopulatedFlyerFields(
        sanitizeFlyerExtractionLocation(coercedExtraction),
      );
      setFlyerExtractionMessage(
        extractionResult.layoutType === "schedule" && batchEventsList.length >= 2
          ? `Schedule flyer detected — this will create ${batchEventsList.length} separate listings. Review each event stop below and remove any you do not want to submit.`
          : batchEventsList.length >= 2
            ? `Multiple events detected — this flyer will create ${batchEventsList.length} separate listings. Review each event stop in the Dates section before submitting.`
            : batchDates.length >= 2
              ? `Multiple dates detected — this flyer will create ${batchDates.length} separate listings (one per date). Review each date in the Dates section before submitting.`
              : populatedCount > 0
                ? `Filled ${populatedCount} field${populatedCount === 1 ? "" : "s"} from your flyer. Review everything before submitting.`
                : "No confident details were found on this flyer. Please complete the form manually.",
      );
    } catch (error) {
      setErrors((current) => ({
        ...current,
        flyerExtraction:
          error instanceof Error ? error.message : "Could not extract details from this flyer.",
      }));
    } finally {
      setIsExtractingFlyer(false);
    }
  }

  function sanitizeFormInputsForSubmit() {
    const sanitizedFormData = slimEventSubmissionForTransport({
      ...formData,
      startDate: commitDateInputValue(formData.startDate),
      endDate: commitDateInputValue(formData.endDate),
      entryDeadline: commitDateInputValue(formData.entryDeadline),
      contactPhone: sanitizeContactPhoneInputValue(formData.contactPhone),
    });
    const sanitizedBatchEventDates = batchEventDates.map((date) => commitDateInputValue(date));
    const sanitizedBatchEvents = slimBatchEventsForTransport(
      batchEvents.map((event) => ({
        ...event,
        startDate: commitDateInputValue(event.startDate),
        endDate: commitDateInputValue(event.endDate),
        entryDeadline: commitDateInputValue(event.entryDeadline),
      })),
    );

    setFormData(sanitizedFormData);
    setBatchEventDates(sanitizedBatchEventDates);
    setBatchEvents(sanitizedBatchEvents);

    return {
      formData: sanitizedFormData,
      batchEventDates: sanitizedBatchEventDates,
      batchEvents: sanitizedBatchEvents,
    };
  }

  async function handleSubmit() {
    if (isUploadingFlyer || isExtractingFlyer) {
      setErrors((current) => ({
        ...current,
        flyer: isExtractingFlyer
          ? "Please wait for flyer extraction to finish."
          : "Please wait for the flyer upload to finish.",
      }));
      return;
    }

    if (flyerFile && !formData.flyerUrl) {
      setErrors((current) => ({
        ...current,
        flyer: "Flyer upload did not complete. Please try uploading again.",
      }));
      return;
    }

    const {
      formData: sanitizedFormData,
      batchEventDates: sanitizedBatchEventDates,
      batchEvents: sanitizedBatchEvents,
    } = sanitizeFormInputsForSubmit();

    const validationErrors = validateForm(
      sanitizedFormData,
      featurePlacement,
      sanitizedBatchEventDates,
      sanitizedBatchEvents,
    );
    if (Object.keys(validationErrors).length > 0) {
      const errorCount = Object.keys(validationErrors).length;
      setErrors({
        ...validationErrors,
        submit: `Please fix ${errorCount} required field${errorCount === 1 ? "" : "s"} highlighted above.`,
      });
      requestAnimationFrame(() => scrollToFirstFormError(validationErrors));
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionPayload = {
        ...sanitizedFormData,
        eventDates: isSameVenueBatch ? sanitizedBatchEventDates : [],
        batchEvents: isMultiEventBatch ? sanitizedBatchEvents : [],
        featurePlacement,
      };
      const submissionBodyBytes = estimateSubmissionPayloadBytes(sanitizedFormData, {
        batchEventDates: isSameVenueBatch ? sanitizedBatchEventDates : [],
        batchEvents: isMultiEventBatch ? sanitizedBatchEvents : [],
        featurePlacement,
      });

      if (submissionBodyBytes > VERCEL_REQUEST_BODY_LIMIT_BYTES) {
        throw new Error(
          "Submission is too large. Shorten the description or entry details and try again.",
        );
      }

      const response = await fetch("/api/events/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionPayload),
      });

      const data = await parseJsonResponse<{
        eventId?: string;
        eventIds?: string[];
        eventCount?: number;
        error?: string;
        duplicateDetected?: boolean;
        duplicateWarnings?: SubmissionDuplicateWarning[];
        confirmationEmails?: {
          sent: string[];
          failed: Array<{ email: string; reason: string }>;
        };
      }>(response, "submit");

      if (!response.ok || (!data.eventId && !(data.eventIds && data.eventIds.length > 0))) {
        throw new Error(data.error ?? "Submission failed");
      }

      if (featurePlacement !== "none") {
        const featuredEventId = data.eventId ?? data.eventIds?.[0];
        if (!featuredEventId) {
          throw new Error(
            "Your events were saved, but featured checkout could not start. Try again from your confirmation email after approval.",
          );
        }

        const checkoutEmail =
          sanitizedFormData.submitterEmail.trim() || sanitizedFormData.contactEmail.trim();
        const checkoutResponse = await fetch("/api/stripe/feature-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: featuredEventId,
            billingType: featurePlacement,
            email: checkoutEmail,
            fromSubmit: true,
          }),
        });

        const checkoutData = await parseJsonResponse<{
          url?: string;
          error?: string;
        }>(checkoutResponse);

        if (!checkoutResponse.ok || !checkoutData.url) {
          throw new Error(
            checkoutData.error ??
              "Your event was saved, but featured checkout could not start. Try again from your confirmation email after approval.",
          );
        }

        try {
          const checkoutUrl = new URL(checkoutData.url);
          if (checkoutUrl.protocol !== "http:" && checkoutUrl.protocol !== "https:") {
            throw new Error("Invalid checkout URL.");
          }
          window.location.assign(checkoutUrl.href);
        } catch {
          throw new Error(
            "Your event was saved, but featured checkout could not start. Try again from your confirmation email after approval.",
          );
        }
        return;
      }

      const sentEmails = data.confirmationEmails?.sent ?? [];
      const failedEmails = data.confirmationEmails?.failed ?? [];

      if (sentEmails.length > 0 && failedEmails.length === 0) {
        setSubmittedEmail(sentEmails.join(", "));
        setConfirmationNotice(null);
      } else if (sentEmails.length > 0 && failedEmails.length > 0) {
        setSubmittedEmail(sentEmails.join(", "));
        const failedAddresses = failedEmails.map((entry) => entry.email).join(", ");
        const testModeFailure = failedEmails.some((entry) =>
          entry.reason.includes("Resend account owner"),
        );
        setConfirmationNotice(
          testModeFailure
            ? `We could not email ${failedAddresses}. Verify your sending domain in Resend and set RESEND_FROM_EMAIL to an address on that domain (not Gmail).`
            : `We could not email ${failedAddresses} right now.`,
        );
      } else if (failedEmails.length > 0) {
        setSubmittedEmail("");
        const testModeFailure = failedEmails.some((entry) =>
          entry.reason.includes("Resend account owner"),
        );
        setConfirmationNotice(
          testModeFailure
            ? "Your event was saved, but confirmation email is limited to the Resend account owner until a sending domain is verified."
            : "Your event was saved, but we could not send a confirmation email right now. Our team still received your submission.",
        );
      } else {
        setSubmittedEmail("");
        setConfirmationNotice(null);
      }

      setSubmitted(true);
      setSubmittedEventCount(data.eventCount ?? 1);
      setSubmittedDuplicateWarnings(data.duplicateWarnings ?? []);
      setFormData(EMPTY_EVENT_SUBMISSION);
      setFeaturePlacement("none");
      setFlyerFile(null);
      setBatchEventDates([]);
      setBatchEvents([]);
      setBatchEventsYearInferred([]);
      setErrors({});
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again.";
      setErrors({
        submit: message.includes("did not match the expected pattern")
          ? "The server returned an unexpected response. Please try again in a moment."
          : message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className={`px-6 py-10 text-center shadow-sm ${themePanelClassName}`}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-primary)]/20 text-2xl text-[var(--color-accent-cta)]">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {submittedEventCount > 1 ? `${submittedEventCount} events submitted` : "Event submitted"}
        </h2>
        <p className={`mx-auto mt-3 max-w-md leading-7 ${themeMutedTextClassName}`}>
          Thanks for listing your event{submittedEventCount > 1 ? "s" : ""}. We&apos;ll review the
          details and publish {submittedEventCount > 1 ? "each listing" : "it"} to the directory soon.
          {submittedEmail
            ? ` A confirmation was sent to ${submittedEmail}.`
            : confirmationNotice
              ? ` ${confirmationNotice}`
              : ""}
        </p>
        <DuplicateSubmissionNotice warnings={submittedDuplicateWarnings} />
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setSubmittedEmail("");
            setSubmittedDuplicateWarnings([]);
            setConfirmationNotice(null);
            setFeaturePlacement("none");
          }}
          className={`mt-6 px-6 py-3 ${themePrimaryButtonClassName}`}
        >
          Submit another event
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FormSection
        title="Event Flyer"
        description="Optional — upload your flyer and we'll read it to pre-fill the form below. JPEG, PNG, or PDF up to 10MB."
      >
        <div>
          <label
            htmlFor="flyer"
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              isUploadingFlyer || isExtractingFlyer
                ? "cursor-wait border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10"
                : "cursor-pointer border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/5"
            }`}
          >
            <span className="text-3xl" aria-hidden="true">
              {isUploadingFlyer ? "⏳" : isExtractingFlyer ? "🔍" : formData.flyerUrl ? "✓" : "📎"}
            </span>
            <span
              className={`mt-3 text-sm font-semibold ${
                !isUploadingFlyer && !isExtractingFlyer && !flyerFile
                  ? "text-[var(--color-accent-cta)]"
                  : "text-[var(--color-text-primary)]"
              }`}
            >
              {isUploadingFlyer
                ? "Uploading to storage..."
                : isExtractingFlyer
                  ? "Reading flyer and filling in details..."
                  : flyerFile
                    ? flyerFile.name
                    : "Choose a flyer to upload (optional)"}
            </span>
            <span className="mt-1 text-xs text-[var(--color-text-muted)]">
              JPEG, PNG, or PDF · Max 10MB
            </span>
            {flyerFile && (
              <span className="mt-2 text-xs font-medium text-[var(--color-accent-primary)]">
                {formatFileSize(flyerFile.size)}
              </span>
            )}
            {formData.flyerUrl && !isUploadingFlyer && !isExtractingFlyer && (
              <span className="mt-2 text-xs font-medium text-emerald-400">
                Uploaded — review the details below
              </span>
            )}
          </label>
          <input
            id="flyer"
            name="flyer"
            type="file"
            accept={FLYER_ACCEPT_ATTRIBUTE}
            className="sr-only"
            disabled={isUploadingFlyer || isExtractingFlyer}
            onChange={(e) => {
              void handleFlyerChange(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          {formData.flyerUrl && !isUploadingFlyer && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void fillFormFromFlyer()}
                disabled={isExtractingFlyer}
                className={`${themeSecondaryButtonClassName} disabled:cursor-wait disabled:opacity-70`}
              >
                {isExtractingFlyer ? "Reading flyer…" : "Re-read flyer"}
              </button>
              <button
                type="button"
                onClick={clearFlyer}
                disabled={isExtractingFlyer}
                className="text-sm font-medium text-[var(--color-accent-primary)] hover:text-[var(--color-text-primary)] disabled:opacity-60"
              >
                Remove file
              </button>
            </div>
          )}
          {flyerExtractionMessage && (
            <p
              className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
                isBatchMode
                  ? "border-amber-300 bg-amber-50 font-medium text-amber-950"
                  : "border-emerald-200 bg-emerald-50 text-emerald-900"
              }`}
            >
              {flyerExtractionMessage}
            </p>
          )}
          {errors.flyerExtraction && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errors.flyerExtraction}
            </p>
          )}
          {errors.flyer && <p className="mt-2 text-sm text-red-700">{errors.flyer}</p>}
        </div>
      </FormSection>

      {isBatchMode ? (
        <BatchSubmissionSummary
          batchEventDates={batchEventDates}
          batchEvents={batchEvents}
          variant="banner"
        />
      ) : null}

      <FormSection
        title="Event Details"
        description="Review and complete anything the flyer didn't capture."
      >
        <TextInput
          name="eventName"
          label="Event Name"
          autoComplete="off"
          value={formData.eventName}
          onChange={(e) => updateField("eventName", e.target.value)}
          error={errors.eventName}
        />
        <SelectInput
          name="format"
          label="Format"
          value={formData.format}
          onChange={(e) => handleFormatChange(e.target.value as SubmissionFormat)}
          options={FORMAT_OPTIONS}
          placeholder="Select format"
          error={errors.format}
        />
        {formData.format === "rodeo" && (
          <CheckboxGroup
            label="Rodeo level(s)"
            hint="ACRA, IPRA, KPRA, URA, CRRA, UPRA, RCA, and MRCA events are Amateur rodeos. Select all levels that apply."
            options={RODEO_LEVEL_OPTIONS}
            values={formData.rodeoLevels}
            onChange={(values) => handleRodeoLevelsChange(values as RodeoLevel[])}
            error={errors.rodeoLevels}
            id="rodeoLevels"
          />
        )}
        <CheckboxGroup
          label={formData.format === "jackpot" ? "Jackpot structure" : "Discipline(s)"}
          hint={
            formData.format === "jackpot"
              ? "Select all jackpot structures that apply to this event."
              : "Select all disciplines that apply to this event."
          }
          options={getDisciplineOptionsForFormat(formData.format)}
          values={formData.disciplines}
          onChange={(values) => handleDisciplinesChange(values as SubmissionDiscipline[])}
          error={errors.disciplines}
          id="disciplines"
        />
        {formData.format === "rodeo" && (
          <AdditionalOfferingsField
            values={formData.additionalOfferings}
            onChange={(values) => updateField("additionalOfferings", values)}
          />
        )}
        <TextArea
          name="description"
          label="Description"
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
        />
      </FormSection>

      <FormSection
        title={
          isScheduleFlyer
            ? "Schedule Events"
            : isMultiEventBatch
              ? "Multiple Event Stops"
              : isSameVenueBatch
                ? "Multiple Dates"
                : "Dates"
        }
        description={
          isScheduleFlyer
            ? "Each event on this schedule becomes its own listing. Review dates, locations, and classes for each stop."
            : isMultiEventBatch
              ? "Each event stop below becomes its own listing. Shared details (name, format, disciplines) apply to every listing."
              : isSameVenueBatch
                ? "Each date below becomes its own listing at the same venue, using the same flyer and shared event details."
                : "Set your event dates and entry deadline."
        }
      >
        {Object.values(inferredYearFields).some(Boolean) && !isMultiEventBatch && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">Please verify event dates</p>
            <p className="mt-1 text-amber-900/90">
              Your flyer did not include a year for the{" "}
              {describeInferredYearDateFields(inferredYearFields)}. We filled in{" "}
              {new Date().getFullYear()} — confirm each date is correct before submitting.
            </p>
          </div>
        )}
        {isMultiEventBatch ? (
          <BatchEventsField
            events={batchEvents}
            errors={errors}
            yearInferred={batchEventsYearInferred}
            duplicateWarnings={scheduleDuplicateWarnings}
            onChange={handleBatchEventsChange}
            onMergeToSingle={mergeBatchToSingleEvent}
          />
        ) : isSameVenueBatch ? (
          <BatchEventDatesField
            dates={batchEventDates}
            errors={errors}
            onChange={handleBatchDatesChange}
            onMergeToSingle={mergeBatchDatesToSingleEvent}
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <DateInput
                name="startDate"
                label="Start Date"
                required
                value={formData.startDate}
                onChange={(value) => updateDateField("startDate", value)}
                error={errors.startDate}
              />
              <DateInput
                name="endDate"
                label="End Date"
                value={formData.endDate}
                onChange={(value) => updateDateField("endDate", value)}
                error={errors.endDate}
                hint="Optional — for multi-day events."
                clearable
                alwaysShowClear
              />
            </div>
            <button type="button" onClick={startBatchMode} className={themeSecondaryButtonClassName}>
              This flyer covers multiple dates
            </button>
          </>
        )}
        {!isMultiEventBatch ? (
          <OptionalDateInput
            id="submitEntryDeadline"
            label="Entry Deadline"
            value={formData.entryDeadline}
            onChange={(value) => updateDateField("entryDeadline", value)}
            error={errors.entryDeadline}
            hint="Optional — leave blank if there is no entry deadline."
          />
        ) : null}
        {!isMultiEventBatch ? (
          <TextArea
            name="classDivisionInfo"
            label="Class or Division Info"
            value={formData.classDivisionInfo}
            onChange={(e) => updateField("classDivisionInfo", e.target.value)}
          />
        ) : null}
      </FormSection>

      {!isMultiEventBatch ? (
        <FormSection
          title="Venue & Location"
          description="Venue or arena name, city, and state are required. Use Roundup Club, RUC, or an arena name when shown on the flyer. If no venue is listed, the event city is used as the venue name. Street address and zip are optional."
        >
          <TextInput
            name="venueName"
            label="Venue Name"
            value={formData.venueName}
            onChange={(e) => updateField("venueName", e.target.value)}
            error={errors.venueName}
          />
          <TextInput
            name="streetAddress"
            label="Street Address"
            value={formData.streetAddress}
            onChange={(e) => updateField("streetAddress", e.target.value)}
            error={errors.streetAddress}
          />
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <TextInput
                name="city"
                label="City"
                value={formData.city}
                onChange={(e) => updateField("city", e.target.value)}
                error={errors.city}
              />
            </div>
            <div className="sm:col-span-1">
              <SelectInput
                name="state"
                label="State"
                value={formData.state}
                onChange={(e) => updateField("state", e.target.value)}
                error={errors.state}
                placeholder="Select state"
                options={US_STATES}
              />
            </div>
            <div className="sm:col-span-1">
              <TextInput
                name="zipCode"
                label="Zip Code"
                value={formData.zipCode}
                onChange={(e) => updateField("zipCode", e.target.value)}
                error={errors.zipCode}
                hint="Optional — add if your flyer includes it."
              />
            </div>
          </div>
        </FormSection>
      ) : null}

      <FormSection
        title={getProducerSectionTitle(formData.format)}
        description={getProducerSectionDescription(formData.format)}
      >
        <TextInput
          name="producerName"
          label={getProducerNameLabel(formData.format)}
          value={formData.producerName}
          onChange={(e) => updateField("producerName", e.target.value)}
          error={errors.producerName}
          hint={getProducerNameHint(formData.format)}
        />
        <TextInput
          name="producerWebsite"
          label={getProducerWebsiteLabel(formData.format)}
          type="text"
          encouraged
          value={formData.producerWebsite}
          onChange={(e) => updateField("producerWebsite", e.target.value)}
          error={errors.producerWebsite}
          placeholder="www.example.com"
          hint="Optional — www. or .com/.net addresses are accepted."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            name="contactEmail"
            label="Contact Email"
            type="text"
            autoComplete="off"
            value={formData.contactEmail}
            onChange={(e) => updateField("contactEmail", e.target.value)}
            error={errors.contactEmail}
          />
          <TextInput
            name="contactPhone"
            label="Contact Phone"
            type="text"
            autoComplete="off"
            value={formData.contactPhone}
            onChange={(e) =>
              updateField("contactPhone", sanitizeContactPhoneInputValue(e.target.value))
            }
          />
        </div>
      </FormSection>

      <FormSection title="Entry & Prizes">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextArea
            name="entryFee"
            label="Entry Fee"
            value={formData.entryFee}
            onChange={(e) => updateField("entryFee", e.target.value)}
            className="min-h-24"
          />
          <TextArea
            name="prizePayoutInfo"
            label="Prize or Payout Info"
            value={formData.prizePayoutInfo}
            onChange={(e) => updateField("prizePayoutInfo", e.target.value)}
            className="min-h-24"
          />
        </div>
      </FormSection>

      <FormSection
        title="Confirmation"
        description="Optional — we'll email you when your listing is live."
      >
        <TextInput
          name="submitterEmail"
          label="Submitter Email"
          type="text"
          autoComplete="off"
          value={formData.submitterEmail}
          onChange={(e) => updateField("submitterEmail", e.target.value)}
          error={errors.submitterEmail}
        />
      </FormSection>

      <FormSection
        title="Homepage Featuring"
        description="Optional paid promotion only — listing your event is free."
        titleClassName="text-[var(--color-accent-cta)]"
      >
        <div id="featurePlacement">
          <FeaturedPlacementField
            value={featurePlacement}
            onChange={(value) => {
              setFeaturePlacement(value);
              setErrors((current) => {
                const next = { ...current };
                delete next.featurePlacement;
                delete next.submit;
                return next;
              });
            }}
            error={errors.featurePlacement}
          />
        </div>
        {isBatchMode && featurePlacement !== "none" ? (
          <p className={`mt-4 text-sm leading-6 ${themeMutedTextClassName}`}>
            Featuring applies to one listing at a time ($15). Checkout covers the first date in
            this submission; you can feature the others after approval.
          </p>
        ) : null}
      </FormSection>

      <div className={`px-4 py-5 sm:px-6 ${themePanelClassName}`}>
        {isBatchMode ? (
          <BatchSubmissionSummary
            batchEventDates={batchEventDates}
            batchEvents={batchEvents}
            variant="submit"
          />
        ) : null}
        <p className={`text-base font-semibold text-[var(--color-text-primary)] ${isBatchMode ? "mt-5" : ""}`}>
          Listing your event is free.
        </p>
        <p className={`mt-2 leading-6 ${themeMutedTextClassName}`}>
          Submitting adds your event to the directory at no cost. Review the details below and
          confirm venue name, city, and state before submitting. Homepage featuring below is
          optional and is the only paid step.
        </p>
        {errors.submit && (
          <p className="mt-4 rounded-xl border border-red-400/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {errors.submit}
          </p>
        )}
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting || isUploadingFlyer || isExtractingFlyer}
          className={`mt-5 w-full px-6 py-4 text-base disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${themePrimaryButtonClassName}`}
        >
          {isSubmitting
            ? featurePlacement !== "none"
              ? "Submitting and starting checkout..."
              : "Submitting..."
            : isBatchMode
              ? featurePlacement !== "none"
                ? `Submit ${getBatchSubmissionCount(batchEventDates, batchEvents)} listings and continue to payment`
                : `Submit ${getBatchSubmissionCount(batchEventDates, batchEvents)} separate listings — free`
              : featurePlacement !== "none"
                ? "Submit event and continue to payment"
                : "Submit event — free"}
        </button>
      </div>
    </div>
  );
}
