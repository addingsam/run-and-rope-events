"use client";

import { useState } from "react";
import { FormSection } from "@/components/submit/FormSection";
import { AdditionalOfferingsField } from "@/components/submit/AdditionalOfferingsField";
import {
  FeaturedPlacementField,
  type FeaturedPlacementChoice,
} from "@/components/submit/FeaturedPlacementField";
import { CheckboxGroup, SelectInput, TextArea, TextInput } from "@/components/submit/FormField";
import {
  DISCIPLINE_OPTIONS,
  FORMAT_OPTIONS,
  RODEO_LEVEL_OPTIONS,
} from "@/lib/events/submission-options";
import {
  applyFlyerExtractionToSubmission,
  countPopulatedFlyerFields,
} from "@/lib/flyer/apply-flyer-extraction";
import {
  FLYER_ACCEPT_ATTRIBUTE,
  validateFlyerFile,
} from "@/lib/flyer/constants";
import { US_STATES } from "@/lib/us-states";
import type { FlyerExtractionResult } from "@/types/flyer-extraction";
import {
  EMPTY_EVENT_SUBMISSION,
  type EventSubmission,
  type RodeoLevel,
  type SubmissionDiscipline,
  type SubmissionFormat,
} from "@/types/event-submission";

type FormErrors = Partial<
  Record<
    keyof EventSubmission | "flyer" | "disciplines" | "featurePlacement" | "flyerExtraction",
    string
  >
>;

function validateForm(
  data: EventSubmission,
  featurePlacement: FeaturedPlacementChoice,
): FormErrors {
  const errors: FormErrors = {};

  if (!data.eventName.trim()) errors.eventName = "Event name is required.";
  if (!data.format) errors.format = "Format is required.";
  if (data.format === "rodeo" && !data.rodeoLevel) {
    errors.rodeoLevel = "Rodeo level is required for rodeo events.";
  }
  if (data.disciplines.length === 0) {
    errors.disciplines = "Select at least one discipline.";
  }
  if (!data.startDate) errors.startDate = "Start date is required.";
  if (!data.venueName.trim()) errors.venueName = "Venue name is required.";
  if (!data.streetAddress.trim()) errors.streetAddress = "Street address is required.";
  if (!data.city.trim()) errors.city = "City is required.";
  if (!data.state) errors.state = "State is required.";
  if (!data.zipCode.trim()) errors.zipCode = "Zip code is required.";
  if (!data.producerName.trim()) errors.producerName = "Producer name is required.";

  if (data.endDate && data.startDate && data.endDate < data.startDate) {
    errors.endDate = "End date must be on or after the start date.";
  }

  if (data.entryDeadline && data.startDate && data.entryDeadline > data.startDate) {
    errors.entryDeadline = "Entry deadline should be before the event start date.";
  }

  if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    errors.contactEmail = "Enter a valid email address.";
  }

  if (data.submitterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.submitterEmail)) {
    errors.submitterEmail = "Enter a valid email address.";
  }

  if (data.producerWebsite && !/^https?:\/\/.+/i.test(data.producerWebsite)) {
    errors.producerWebsite = "Enter a valid URL starting with http:// or https://.";
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

export function EventSubmissionForm() {
  const [formData, setFormData] = useState<EventSubmission>(EMPTY_EVENT_SUBMISSION);
  const [featurePlacement, setFeaturePlacement] = useState<FeaturedPlacementChoice>("none");
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [isUploadingFlyer, setIsUploadingFlyer] = useState(false);
  const [isExtractingFlyer, setIsExtractingFlyer] = useState(false);
  const [flyerExtractionMessage, setFlyerExtractionMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleFormatChange(format: SubmissionFormat) {
    setFormData((current) => ({
      ...current,
      format,
      rodeoLevel: format === "rodeo" ? current.rodeoLevel : "",
      additionalOfferings: format === "rodeo" ? current.additionalOfferings : [],
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.format;
      if (format !== "rodeo") {
        delete next.rodeoLevel;
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

  function updateField<K extends keyof EventSubmission>(field: K, value: EventSubmission[K]) {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function clearFlyer() {
    setFlyerFile(null);
    setFlyerExtractionMessage(null);
    updateField("flyerUrl", "");
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
    updateField("flyerUrl", "");
    setErrors((current) => {
      const next = { ...current };
      delete next.flyer;
      return next;
    });

    try {
      const body = new FormData();
      body.append("flyer", file);

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
    setErrors((current) => {
      const next = { ...current };
      delete next.flyerExtraction;
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

      setFormData((current) => applyFlyerExtractionToSubmission(current, data.extracted!));
      setErrors({});

      const populatedCount = countPopulatedFlyerFields(data.extracted);
      setFlyerExtractionMessage(
        populatedCount > 0
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

    const validationErrors = validateForm(formData, featurePlacement);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value
            .map((item) => (typeof item === "string" ? item.trim() : item))
            .filter(Boolean)
            .forEach((item) => body.append(key, String(item)));
          return;
        }

        if (value) body.append(key, value);
      });

      const response = await fetch("/api/events/submit", {
        method: "POST",
        body,
      });

      const data = (await response.json()) as {
        eventId?: string;
        error?: string;
      };

      if (!response.ok || !data.eventId) {
        throw new Error(data.error ?? "Submission failed");
      }

      if (featurePlacement !== "none") {
        const checkoutEmail = formData.submitterEmail.trim() || formData.contactEmail.trim();
        const checkoutResponse = await fetch("/api/stripe/feature-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: data.eventId,
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

      setSubmittedEmail(formData.submitterEmail);
      setSubmitted(true);
      setFormData(EMPTY_EVENT_SUBMISSION);
      setFeaturePlacement("none");
      setFlyerFile(null);
      setErrors({});
    } catch (submitError) {
      setErrors({
        eventName:
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
      <div className="rounded-2xl border border-amber-200 bg-white px-6 py-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-amber-950">Event submitted</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-amber-900/75">
          Thanks for listing your event. We&apos;ll review the details and publish it to the
          directory soon.
          {submittedEmail
            ? ` A confirmation will be sent to ${submittedEmail}.`
            : ""}
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setSubmittedEmail("");
            setFeaturePlacement("none");
          }}
          className="mt-6 rounded-full bg-amber-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
        >
          Submit another event
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <FormSection
        title="Event Flyer"
        description="Start here — upload your flyer and we'll read it to pre-fill the form below. JPEG, PNG, or PDF up to 10MB."
      >
        <div>
          <label
            htmlFor="flyer"
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              isUploadingFlyer || isExtractingFlyer
                ? "cursor-wait border-amber-400 bg-amber-50/80"
                : "cursor-pointer border-amber-300 bg-[#fffaf3] hover:border-amber-500 hover:bg-amber-50/60"
            }`}
          >
            <span className="text-3xl" aria-hidden="true">
              {isUploadingFlyer ? "⏳" : isExtractingFlyer ? "🔍" : formData.flyerUrl ? "✓" : "📎"}
            </span>
            <span className="mt-3 text-sm font-semibold text-amber-950">
              {isUploadingFlyer
                ? "Uploading to storage..."
                : isExtractingFlyer
                  ? "Reading flyer and filling in details..."
                  : flyerFile
                    ? flyerFile.name
                    : "Choose a flyer to upload"}
            </span>
            <span className="mt-1 text-xs text-amber-900/60">
              JPEG, PNG, or PDF · Max 10MB
            </span>
            {flyerFile && (
              <span className="mt-2 text-xs font-medium text-amber-800">
                {formatFileSize(flyerFile.size)}
              </span>
            )}
            {formData.flyerUrl && !isUploadingFlyer && !isExtractingFlyer && (
              <span className="mt-2 text-xs font-medium text-emerald-800">
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
                className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-50 disabled:cursor-wait disabled:opacity-70"
              >
                {isExtractingFlyer ? "Reading flyer…" : "Re-read flyer"}
              </button>
              <button
                type="button"
                onClick={clearFlyer}
                disabled={isExtractingFlyer}
                className="text-sm font-medium text-amber-800 hover:text-amber-950 disabled:opacity-60"
              >
                Remove file
              </button>
            </div>
          )}
          {flyerExtractionMessage && (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
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
          placeholder="Spring Barrel Bash"
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
          <SelectInput
            name="rodeoLevel"
            label="Rodeo Level"
            value={formData.rodeoLevel}
            onChange={(e) => updateField("rodeoLevel", e.target.value as RodeoLevel)}
            options={RODEO_LEVEL_OPTIONS}
            placeholder="Select rodeo level"
            error={errors.rodeoLevel}
          />
        )}
        <CheckboxGroup
          label={formData.format === "jackpot" ? "Jackpot structure" : "Discipline(s)"}
          hint={
            formData.format === "jackpot"
              ? "Select all jackpot structures that apply to this event."
              : "Select all disciplines that apply to this event."
          }
          options={DISCIPLINE_OPTIONS}
          values={formData.disciplines}
          onChange={(values) => handleDisciplinesChange(values as SubmissionDiscipline[])}
          error={errors.disciplines}
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
          placeholder="Share schedule details, added money, stall info, or anything riders should know."
        />
      </FormSection>

      <FormSection
        title="Dates"
        description="Set your event dates and entry deadline."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            name="startDate"
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
            error={errors.startDate}
          />
          <TextInput
            name="endDate"
            label="End Date"
            type="date"
            value={formData.endDate}
            onChange={(e) => updateField("endDate", e.target.value)}
            error={errors.endDate}
            hint="Optional — for multi-day events."
          />
        </div>
        <TextInput
          name="entryDeadline"
          label="Entry Deadline"
          type="date"
          value={formData.entryDeadline}
          onChange={(e) => updateField("entryDeadline", e.target.value)}
          error={errors.entryDeadline}
        />
        <TextArea
          name="classDivisionInfo"
          label="Class or Division Info"
          value={formData.classDivisionInfo}
          onChange={(e) => updateField("classDivisionInfo", e.target.value)}
          placeholder="Open 4D, youth breakaway, #9 header, etc."
        />
      </FormSection>

      <FormSection title="Venue & Location" description="Where will riders find you?">
        <TextInput
          name="venueName"
          label="Venue Name"
          value={formData.venueName}
          onChange={(e) => updateField("venueName", e.target.value)}
          error={errors.venueName}
          placeholder="Triple R Arena"
        />
        <TextInput
          name="streetAddress"
          label="Street Address"
          value={formData.streetAddress}
          onChange={(e) => updateField("streetAddress", e.target.value)}
          error={errors.streetAddress}
          placeholder="1200 County Road 101"
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
              inputMode="numeric"
              value={formData.zipCode}
              onChange={(e) => updateField("zipCode", e.target.value)}
              error={errors.zipCode}
              placeholder="76401"
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Producer & Contact"
        description="Producer name appears on every listing so riders know who's running the event."
      >
        <TextInput
          name="producerName"
          label="Producer Name"
          value={formData.producerName}
          onChange={(e) => updateField("producerName", e.target.value)}
          error={errors.producerName}
          hint="Always shown on the event listing."
          placeholder="Rockin' R Productions"
        />
        <TextInput
          name="producerWebsite"
          label="Producer Website"
          type="url"
          encouraged
          value={formData.producerWebsite}
          onChange={(e) => updateField("producerWebsite", e.target.value)}
          error={errors.producerWebsite}
          placeholder="https://example.com"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            name="contactEmail"
            label="Contact Email"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => updateField("contactEmail", e.target.value)}
            error={errors.contactEmail}
            placeholder="info@example.com"
          />
          <TextInput
            name="contactPhone"
            label="Contact Phone"
            type="tel"
            value={formData.contactPhone}
            onChange={(e) => updateField("contactPhone", e.target.value)}
            placeholder="(555) 555-0100"
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
            placeholder="e.g. $45 per event, $10 office fee, $75 for the open division."
            className="min-h-24"
          />
          <TextArea
            name="prizePayoutInfo"
            label="Prize or Payout Info"
            value={formData.prizePayoutInfo}
            onChange={(e) => updateField("prizePayoutInfo", e.target.value)}
            placeholder="Added money, payout structure, jackpot details..."
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
          placeholder="you@example.com"
        />
      </FormSection>

      <FormSection
        title="Homepage Featuring"
        description="Optional paid promotion on the main page."
      >
        <FeaturedPlacementField
          value={featurePlacement}
          onChange={(value) => {
            setFeaturePlacement(value);
            setErrors((current) => {
              const next = { ...current };
              delete next.featurePlacement;
              return next;
            });
          }}
          error={errors.featurePlacement}
        />
      </FormSection>

      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 px-4 py-5 sm:px-6">
        <p className="text-sm leading-6 text-amber-900/75">
          Upload your flyer first, then review the details below. Required fields are checked when
          you submit. Producer name will always be displayed on your listing. No account is required.
        </p>
        <button
          type="submit"
          disabled={isSubmitting || isUploadingFlyer || isExtractingFlyer}
          className="mt-5 w-full rounded-full bg-amber-800 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting
            ? featurePlacement !== "none"
              ? "Submitting and starting checkout..."
              : "Submitting..."
            : featurePlacement !== "none"
              ? "Submit event and continue to payment"
              : "Submit event"}
        </button>
      </div>
    </form>
  );
}
