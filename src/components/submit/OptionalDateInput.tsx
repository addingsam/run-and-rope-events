"use client";

import { useId } from "react";
import { FieldLabel } from "@/components/submit/FormField";
import { toHtmlDateInputValue } from "@/lib/flyer/normalize-flyer-date";
import { themeInputClassName } from "@/lib/theme/form-classes";

interface OptionalDateInputProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  addLabel?: string;
}

export function OptionalDateInput({
  id,
  label,
  hint,
  error,
  value,
  onChange,
}: OptionalDateInputProps) {
  const fallbackId = useId();
  const fieldId = id || fallbackId;
  const displayValue = toHtmlDateInputValue(value);

  return (
    <div>
      <FieldLabel htmlFor={fieldId} label={label} hint={hint} />
      <div className="flex items-center gap-2">
        <input
          id={fieldId}
          name={fieldId}
          type="date"
          autoComplete="off"
          data-1p-ignore="true"
          data-lpignore="true"
          value={displayValue}
          onChange={(event) => onChange(event.target.value)}
          className={`${themeInputClassName} min-w-0 flex-1 cursor-pointer ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
        />
        {displayValue ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={`Clear ${label}`}
            className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
          >
            Clear
          </button>
        ) : null}
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
