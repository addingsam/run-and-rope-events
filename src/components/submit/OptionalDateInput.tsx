"use client";

import { useEffect, useId, useRef, useState } from "react";
import { sanitizeHtmlDateInputValue } from "@/lib/flyer/normalize-flyer-date";
import {
  themeHintClassName,
  themeInputClassName,
  themeLabelClassName,
  themeSecondaryButtonClassName,
} from "@/lib/theme/form-classes";

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
  addLabel,
}: OptionalDateInputProps) {
  const fallbackId = useId();
  const fieldId = id || fallbackId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(Boolean(value));

  useEffect(() => {
    if (value) {
      setIsEditing(true);
      return;
    }

    setIsEditing(false);
  }, [value]);

  function clearDate() {
    onChange("");
    setIsEditing(false);
  }

  function openDatePicker() {
    setIsEditing(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.showPicker?.();
    });
  }

  const addButtonLabel = addLabel ?? `Add ${label.toLowerCase()}`;
  const safeValue = sanitizeHtmlDateInputValue(value);

  return (
    <div>
      <div className="mb-2">
        <label htmlFor={fieldId} className={themeLabelClassName}>
          {label}
        </label>
        {hint ? <p className={themeHintClassName}>{hint}</p> : null}
      </div>

      {!isEditing && !safeValue ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className={`text-sm ${themeHintClassName}`}>No date selected.</p>
          <button type="button" onClick={openDatePicker} className={themeSecondaryButtonClassName}>
            {addButtonLabel}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            id={fieldId}
            name={fieldId}
            type="date"
            autoComplete="off"
            data-1p-ignore="true"
            data-lpignore="true"
            value={safeValue}
            onChange={(event) => onChange(sanitizeHtmlDateInputValue(event.target.value))}
            onBlur={(event) => {
              if (!event.target.value) {
                setIsEditing(false);
              }
            }}
            className={`${themeInputClassName} min-w-0 flex-1 ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
          />
          <button
            type="button"
            onClick={clearDate}
            aria-label={safeValue ? `Clear ${label}` : `Cancel ${label}`}
            className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
          >
            {safeValue ? "Clear" : "Cancel"}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
