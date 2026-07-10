"use client";

const inputClassName =
  "w-full rounded-xl border border-amber-200 bg-[#fffaf3] px-4 py-3 text-base text-amber-950 placeholder:text-amber-900/40 transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20";

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
        <p className="block text-sm font-semibold text-amber-950">Also at this rodeo</p>
        <p className="mt-1 text-xs leading-5 text-amber-900/60">
          Optional — list extra attractions like roughstock events, fan events, or concerts.
          These are descriptive only and won&apos;t affect search or filters.
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
              className={inputClassName}
              aria-label={`Additional offering ${index + 1}`}
            />
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="rounded-full border border-amber-200 px-4 py-3 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-50 sm:shrink-0"
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
        className="mt-3 text-sm font-semibold text-amber-800 hover:text-amber-950"
      >
        + Add another offering
      </button>
    </div>
  );
}
