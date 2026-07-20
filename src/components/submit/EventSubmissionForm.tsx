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
import { CheckboxGroup, OptionalDateInput, SelectInput, TextArea, TextInput } from "@/components/submit/FormField";
import {
  DISCIPLINE_OPTIONS,
  filterDisciplinesForFormat,
  FORMAT_OPTIONS,
  getDisciplineOptionsForFormat,
  RODEO_LEVEL_OPTIONS,
} from "@/lib/events/submission-options";
import {
  getProducerNameLabel,
  getProducerSectionDescription,
  getProducerSectionTitle,
  getProducerWebsiteLabel,
} from "@/lib/events/producer-labels";
import {
  applyFlyerExtractionToSubmission,
  countPopulatedFlyerFields,
  EMPTY_FLYER_INFERRED_YEAR_FIELDS,
  type FlyerInferredYearFields,
} from "@/lib/flyer/apply-flyer-extraction";
import { sanitizeFlyerExtractionLocation } from "@/lib/flyer/sanitize-flyer-location";
import {
  FLYER_ACCEPT_ATTRIBUTE,
  validateFlyerFile,
} from "@/lib/flyer/constants";
import { createFlyerUploadPayload } from "@/lib/flyer/flyer-file-name";
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

function scrollToFirstFormError(errors: FormErrors) {
  const firstKey = ERROR_FIELD_ORDER.find((key) => errors[key]);
  if (!firstKey) {
    return;
  }

  const fieldId =
    firstKey === "disciplines"
      ? "disciplines"
      : firstKey === "featurePlacement"
        ? "featurePlacement"
        : firstKey;

  const element =
    document.getElementById(fieldId) ??
    document.querySelector<HTMLElement>(`[name="${fieldId}"]`);

  element?.scrollIntoView({ behavior: "smooth", block: "center" });

  if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
    element.focus({ preventScroll: true });
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
        const response = await fetch("/api/events/submit/check-duplicates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            batchEvents,
          }),
        });

        const data = (await response.json()) as {
          locationWarnings?: ScheduleDuplicateWarning[];
          error?: string;
        };

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
    updateField("disciplines", disciplines);
    setErrors((current) => {
      const next = { ...current };
      delete next.disciplines;
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
      return next;
    });

    try {
      const { file: uploadFile, originalFileName } = createFlyerUploadPayload(file);
      const body = new FormData();
      body.append("flyer", uploadFile);
      body.append("originalFileName", originalFileName);

      const response = await fetch("/api/events/upload-flyer", {
        method: "POST",
        body,
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Flyer upload failed.");
      }

      updateField("flyerUrl", data.url);
      await fillFormFromFlyer(data.url);
    } catch (error) {
      setFlyerFile(null);
      setErrors((current) => ({
        ...current,
        flyer: error instanceof Error ? error.message : "Flyer upload failed.",
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

      const data = (await response.json()) as {
        extracted?: FlyerExtractionResult;
        error?: string;
      };

      if (!response.ok || !data.extracted) {
        throw new Error(data.error ?? "Could not extract details from this flyer.");
      }

      let extractionResult!: ReturnType<typeof applyFlyerExtractionToSubmission>;
      setFormData((current) => {
        extractionResult = applyFlyerExtractionToSubmission(current, data.extracted!);
        return extractionResult.submission;
      });
      setBatchEventDates(extractionResult.batchEventDates);
      setBatchEvents(extractionResult.batchEvents);
      setBatchEventsYearInferred(extractionResult.batchEventsYearInferred);
      setFlyerLayoutType(extractionResult.layoutType);
      setScheduleDuplicateWarnings([]);
      setInferredYearFields(extractionResult.inferredYearFields);
      setErrors({});

      const populatedCount = countPopulatedFlyerFields(
        sanitizeFlyerExtractionLocation(data.extracted),
      );
      setFlyerExtractionMessage(
        extractionResult.layoutType === "schedule" && extractionResult.batchEvents.length >= 2
          ? `Schedule flyer detected — this will create ${extractionResult.batchEvents.length} separate listings. Review each event stop below and remove any you do not want to submit.`
          : extractionResult.batchEvents.length >= 2
            ? `Multiple events detected — this flyer will create ${extractionResult.batchEvents.length} separate listings. Review each event stop in the Dates section before submitting.`
            : extractionResult.batchEventDates.length >= 2
              ? `Multiple dates detected — this flyer will create ${extractionResult.batchEventDates.length} separate listings (one per date). Review each date in the Dates section before submitting.`
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

    const validationErrors = validateForm(
      formData,
      featurePlacement,
      batchEventDates,
      batchEvents,
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
      const response = await fetch("/api/events/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          eventDates: isSameVenueBatch ? batchEventDates : [],
          batchEvents: isMultiEventBatch ? batchEvents : [],
          featurePlacement,
        }),
      });

      const data = (await response.json()) as {
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
      };

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

        const checkoutEmail = formData.submitterEmail.trim() || formData.contactEmail.trim();
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

        const checkoutData = (await checkoutResponse.json()) as {
          url?: string;
          error?: string;
        };

        if (!checkoutResponse.ok || !checkoutData.url) {
          throw new Error(
            checkoutData.error ??
              "Your event was saved, but featured checkout could not start. Try again from your confirmation email after approval.",
          );
        }

        window.location.href = checkoutData.url;
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
      setErrors({
        submit:
          submitError instanceof Error
            ? submitError.message
            : "Something went wrong. Please try again.",
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
    <form onSubmit={handleSubmit} className="space-y-6" noValidate autoComplete="off">
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
          />
        ) : isSameVenueBatch ? (
          <BatchEventDatesField
            dates={batchEventDates}
            errors={errors}
            onChange={handleBatchDatesChange}
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextInput
                name="startDate"
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => updateDateField("startDate", e.target.value)}
                error={errors.startDate}
              />
              <TextInput
                name="endDate"
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => updateDateField("endDate", e.target.value)}
                error={errors.endDate}
                hint="Optional — for multi-day events."
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
            required
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
                required
                value={formData.city}
                onChange={(e) => updateField("city", e.target.value)}
                error={errors.city}
              />
            </div>
            <div className="sm:col-span-1">
              <SelectInput
                name="state"
                label="State"
                required
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
                inputMode="numeric"
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
          hint="Always shown on the event listing."
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
            type="email"
            value={formData.contactEmail}
            onChange={(e) => updateField("contactEmail", e.target.value)}
            error={errors.contactEmail}
          />
          <TextInput
            name="contactPhone"
            label="Contact Phone"
            type="tel"
            value={formData.contactPhone}
            onChange={(e) => updateField("contactPhone", e.target.value)}
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
          type="email"
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
          confirm venue name, city, and state before submitting.
          {formData.format === "rodeo"
            ? " Producer or stock contractor name will always be displayed on your listing."
            : " Producer name will always be displayed on your listing."}{" "}
          Homepage featuring below is
          optional and is the only paid step.
        </p>
        {errors.submit && (
          <p className="mt-4 rounded-xl border border-red-400/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {errors.submit}
          </p>
        )}
        <button
          type="submit"
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
    </form>
  );
}
