"use client";

import { forwardRef, useId, useRef } from "react";
import { FieldLabel } from "@/components/submit/FormField";
import { toHtmlDateInputValue } from "@/lib/flyer/normalize-flyer-date";
import { themeInputClassName } from "@/lib/theme/form-classes";

interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  /** Show a button to clear the selected date. */
  clearable?: boolean;
  /** Keep the clear button visible even when the field is empty. */
  alwaysShowClear?: boolean;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  {
    label,
    hint,
    error,
    id,
    name,
    value,
    onChange,
    required,
    className,
    onBlur,
    clearable = false,
    alwaysShowClear = false,
    ...props
  },
  ref,
) {
  const fallbackId = useId();
  const fieldId = id ?? name ?? fallbackId;
  const inputRef = useRef<HTMLInputElement>(null);
  const displayValue = toHtmlDateInputValue(value);
  const isEmpty = !displayValue;
  const showClearButton = clearable && (alwaysShowClear || !isEmpty);

  function openPicker() {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    input.focus();
    input.showPicker?.();
  }

  return (
    <div>
      <FieldLabel htmlFor={fieldId} label={label} required={required} hint={hint} />
      <div className="flex items-center gap-2">
        <input
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          id={fieldId}
          name={name}
          type="date"
          required={required}
          autoComplete="off"
          data-1p-ignore="true"
          data-lpignore="true"
          data-empty={isEmpty ? "true" : undefined}
          value={displayValue}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          onClick={() => {
            if (isEmpty) {
              openPicker();
            }
          }}
          className={`date-field-input min-w-0 flex-1 ${themeInputClassName} cursor-pointer ${isEmpty ? "date-field-input--empty" : ""} ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""} ${className ?? ""}`}
          {...props}
        />
        {showClearButton ? (
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={isEmpty}
            aria-label={`Clear ${label}`}
            className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear
          </button>
        ) : null}
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
});
