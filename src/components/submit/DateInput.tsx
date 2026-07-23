"use client";

import { forwardRef } from "react";
import { FieldLabel } from "@/components/submit/FormField";
import { commitDateInputValue, toHtmlDateInputValue } from "@/lib/flyer/normalize-flyer-date";
import { themeInputClassName } from "@/lib/theme/form-classes";

interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { label, hint, error, id, name, value, onChange, required, className, onBlur, ...props },
  ref,
) {
  const fieldId = id ?? name;

  return (
    <div>
      <FieldLabel htmlFor={fieldId!} label={label} required={required} hint={hint} />
      <input
        ref={ref}
        id={fieldId}
        name={name}
        type="date"
        required={required}
        autoComplete="off"
        data-1p-ignore="true"
        data-lpignore="true"
        value={toHtmlDateInputValue(value)}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => {
          onChange(commitDateInputValue(event.target.value));
          onBlur?.(event);
        }}
        className={`${themeInputClassName} cursor-pointer ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""} ${className ?? ""}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
});
