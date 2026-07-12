import { forwardRef } from "react";
import {
  themeCheckboxGroupClassName,
  themeCheckboxInputClassName,
  themeCheckboxRowClassName,
  themeHintClassName,
  themeInputClassName,
  themeLabelClassName,
} from "@/lib/theme/form-classes";

interface FieldLabelProps {
  htmlFor: string;
  label: string;
  required?: boolean;
  hint?: string;
  encouraged?: boolean;
}

export function FieldLabel({ htmlFor, label, required, hint, encouraged }: FieldLabelProps) {
  return (
    <div className="mb-2">
      <label htmlFor={htmlFor} className={themeLabelClassName}>
        {label}
        {required && <span className="ml-1 text-[var(--color-accent-cta)]">*</span>}
        {encouraged && (
          <span className="ml-2 text-xs font-medium text-[var(--color-accent-primary)]">
            (strongly encouraged)
          </span>
        )}
      </label>
      {hint && <p className={themeHintClassName}>{hint}</p>}
    </div>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  encouraged?: boolean;
  error?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, hint, encouraged, error, id, required, className, ...props },
  ref,
) {
  const fieldId = id ?? props.name;

  return (
    <div>
      <FieldLabel
        htmlFor={fieldId!}
        label={label}
        required={required}
        hint={hint}
        encouraged={encouraged}
      />
      <input
        ref={ref}
        id={fieldId}
        required={required}
        className={`${themeInputClassName} ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""} ${className ?? ""}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
});

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(function SelectInput(
  { label, hint, error, id, required, options, placeholder, className, ...props },
  ref,
) {
  const fieldId = id ?? props.name;

  return (
    <div>
      <FieldLabel htmlFor={fieldId!} label={label} required={required} hint={hint} />
      <select
        ref={ref}
        id={fieldId}
        required={required}
        className={`${themeInputClassName} appearance-none ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""} ${className ?? ""}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
});

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, id, required, className, ...props },
  ref,
) {
  const fieldId = id ?? props.name;

  return (
    <div>
      <FieldLabel htmlFor={fieldId!} label={label} required={required} hint={hint} />
      <textarea
        ref={ref}
        id={fieldId}
        required={required}
        className={`${themeInputClassName} min-h-32 resize-y ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""} ${className ?? ""}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
});

interface CheckboxGroupProps {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  id?: string;
  options: readonly { value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
}

export function CheckboxGroup({
  label,
  hint,
  required,
  error,
  id = "disciplines",
  options,
  values,
  onChange,
}: CheckboxGroupProps) {
  function toggleValue(value: string) {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
      return;
    }

    onChange([...values, value]);
  }

  return (
    <div id={id}>
      <FieldLabel htmlFor={id} label={label} required={required} hint={hint} />
      <div className={themeCheckboxGroupClassName}>
        {options.map((option) => {
          const checked = values.includes(option.value);

          return (
            <label key={option.value} className={themeCheckboxRowClassName}>
              <input
                type="checkbox"
                name="disciplines"
                value={option.value}
                checked={checked}
                onChange={() => toggleValue(option.value)}
                className={themeCheckboxInputClassName}
              />
              <span className="text-sm leading-6 text-[var(--color-text-primary)]">
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
