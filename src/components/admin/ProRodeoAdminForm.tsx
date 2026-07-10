"use client";

import { useState, useTransition } from "react";
import { createProRodeoListing } from "@/app/admin/pro-rodeos/new/actions";
import { SelectInput, TextInput } from "@/components/submit/FormField";
import { FormSection } from "@/components/submit/FormSection";
import { US_STATES } from "@/lib/us-states";
import {
  EMPTY_PRO_RODEO_FORM,
  type ProRodeoFormInput,
  type SanctioningBody,
} from "@/types/pro-rodeo-form";

const SANCTIONING_BODY_OPTIONS = [
  { value: "WPRA", label: "WPRA" },
  { value: "PRCA", label: "PRCA" },
] as const;

export function ProRodeoAdminForm() {
  const [formData, setFormData] = useState(EMPTY_PRO_RODEO_FORM);
  const [adminPassword, setAdminPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof typeof EMPTY_PRO_RODEO_FORM>(
    field: K,
    value: (typeof EMPTY_PRO_RODEO_FORM)[K],
  ) {
    setFormData((current) => ({ ...current, [field]: value }));
    setMessage(null);
    setIsSuccess(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: ProRodeoFormInput = {
      ...formData,
      adminPassword,
    };

    startTransition(async () => {
      const result = await createProRodeoListing(payload);
      setMessage(result.message);
      setIsSuccess(result.success);

      if (result.success) {
        setFormData(EMPTY_PRO_RODEO_FORM);
        setAdminPassword("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection
        title="Pro Rodeo Details"
        description="Add a WPRA or PRCA listing. City and state will be geocoded on save."
      >
        <TextInput
          name="rodeoName"
          label="Rodeo Name"
          required
          value={formData.rodeoName}
          onChange={(e) => updateField("rodeoName", e.target.value)}
          placeholder="National Finals Rodeo"
        />
        <SelectInput
          name="sanctioningBody"
          label="Sanctioning Body"
          required
          value={formData.sanctioningBody}
          onChange={(e) => updateField("sanctioningBody", e.target.value as SanctioningBody)}
          options={SANCTIONING_BODY_OPTIONS}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            name="city"
            label="City"
            required
            value={formData.city}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="Las Vegas"
          />
          <SelectInput
            name="state"
            label="State"
            required
            value={formData.state}
            onChange={(e) => updateField("state", e.target.value)}
            placeholder="Select state"
            options={US_STATES}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            name="startDate"
            label="Start Date"
            type="date"
            required
            value={formData.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
          />
          <TextInput
            name="endDate"
            label="End Date"
            type="date"
            value={formData.endDate}
            onChange={(e) => updateField("endDate", e.target.value)}
            hint="Optional — for multi-day rodeos."
          />
        </div>
        <TextInput
          name="externalLink"
          label="External Link"
          type="url"
          required
          value={formData.externalLink}
          onChange={(e) => updateField("externalLink", e.target.value)}
          placeholder="https://www.prorodeo.com/..."
          hint="Official WPRA or PRCA event page."
        />
      </FormSection>

      <FormSection
        title="Admin Access"
        description="Required when ADMIN_SECRET is configured in the environment."
      >
        <TextInput
          name="adminPassword"
          label="Admin Password"
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          placeholder="Enter admin password"
        />
      </FormSection>

      {message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            isSuccess
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-stone-900 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving and geocoding..." : "Save pro rodeo"}
      </button>
    </form>
  );
}
