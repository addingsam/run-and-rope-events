import { forwardRef } from "react";

const inputClassName =
  "w-full rounded-xl border border-amber-200 bg-[#fffaf3] px-4 py-3 text-base text-amber-950 placeholder:text-amber-900/40 transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20";

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
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-amber-950">
        {label}
        {required && <span className="ml-1 text-amber-700">*</span>}
        {encouraged && (
          <span className="ml-2 text-xs font-medium text-amber-700">(strongly encouraged)</span>
        )}
      </label>
      {hint && <p className="mt-1 text-xs leading-5 text-amber-900/60">{hint}</p>}
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
        className={`${inputClassName} ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""} ${className ?? ""}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
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
        className={`${inputClassName} appearance-none bg-[#fffaf3] ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""} ${className ?? ""}`}
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
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
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
        className={`${inputClassName} min-h-32 resize-y ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""} ${className ?? ""}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
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
      <div className="space-y-3 rounded-xl border border-amber-200 bg-[#fffaf3] p-4">
        {options.map((option) => {
          const checked = values.includes(option.value);

          return (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-amber-50"
            >
              <input
                type="checkbox"
                name="disciplines"
                value={option.value}
                checked={checked}
                onChange={() => toggleValue(option.value)}
                className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-700 focus:ring-amber-500/30"
              />
              <span className="text-sm leading-6 text-amber-950">{option.label}</span>
            </label>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
