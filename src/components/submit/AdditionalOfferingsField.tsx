"use client";

import {
  themeHintClassName,
  themeInputClassName,
  themeLabelClassName,
  themeSecondaryButtonClassName,
} from "@/lib/theme/form-classes";

interface AdditionalOfferingsFieldProps {
  values: string[];
  onChange: (values: string[]) => void;
}

export function AdditionalOfferingsField({ values, onChange }: AdditionalOfferingsFieldProps) {
  const rows = values.length > 0 ? values : [""];

  function updateRow(index: number, value: string) {
    const next = [...rows];
    next[index] = value;
    onChange(next);
  }

  function addRow() {
    onChange([...rows, ""]);
  }

  function removeRow(index: number) {
    const next = rows.filter((_, rowIndex) => rowIndex !== index);
    onChange(next);
  }

  return (
    <div>
      <div className="mb-3">
        <p className={themeLabelClassName}>Also at this rodeo</p>
        <p className={themeHintClassName}>
          Optional — list extra attractions like roughstock events, fan events, or concerts. These
          are descriptive only and won&apos;t affect search or filters.
        </p>
      </div>
      <div className="space-y-3">
        {rows.map((value, index) => (
          <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              name="additionalOfferings"
              value={value}
              onChange={(e) => updateRow(index, e.target.value)}
              placeholder="Bull riding, mutton bustin', live concert..."
              className={themeInputClassName}
              aria-label={`Additional offering ${index + 1}`}
            />
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(index)}
                className={`px-4 py-3 sm:shrink-0 ${themeSecondaryButtonClassName}`}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-3 text-sm font-semibold text-[var(--color-accent-primary)] hover:text-[var(--color-text-primary)]"
      >
        + Add another offering
      </button>
    </div>
  );
}
