import { FEATURED_PLACEMENT } from "@/lib/stripe/featured";
import {
  themeCheckboxInputClassName,
  themeCheckboxRowClassName,
  themeMutedTextClassName,
} from "@/lib/theme/form-classes";
import type { FeaturedBillingType } from "@/lib/stripe/featured";

export type FeaturedPlacementChoice = "none" | FeaturedBillingType;

interface FeaturedPlacementFieldProps {
  value: FeaturedPlacementChoice;
  onChange: (value: FeaturedPlacementChoice) => void;
  error?: string;
}

const OPTIONS: Array<{
  value: FeaturedPlacementChoice;
  title: string;
  description: string;
}> = [
  {
    value: "none",
    title: "Standard listing only (free)",
    description: "List your event in the directory at no cost. No payment required.",
  },
  {
    value: "one_time",
    title: FEATURED_PLACEMENT.oneTimeLabel,
    description:
      "One-time payment for 30 days of homepage featuring, visible immediately after payment.",
  },
  {
    value: "recurring",
    title: FEATURED_PLACEMENT.recurringLabel,
    description:
      "Recurring payment renews homepage featuring every 30 days until you cancel in Stripe.",
  },
];

export function FeaturedPlacementField({
  value,
  onChange,
  error,
}: FeaturedPlacementFieldProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--color-accent-cta)]">
          Homepage featuring (optional)
        </h3>
        <p className={`mt-2 leading-6 ${themeMutedTextClassName}`}>
          Listing your event is free. {FEATURED_PLACEMENT.description} Featured events appear on the
          main homepage in the Featured events section and are visible to everyone — including
          visitors without a paid subscription.
        </p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer gap-3 rounded-2xl px-4 py-4 transition-colors ${themeCheckboxRowClassName} ${
                selected ? "border-[var(--color-accent-primary)]/40 bg-[var(--color-accent-primary)]/15" : ""
              }`}
            >
              <input
                type="radio"
                name="featurePlacement"
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className={themeCheckboxInputClassName}
              />
              <span>
                <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
                  {option.title}
                </span>
                <span className={`mt-1 block leading-6 ${themeMutedTextClassName}`}>
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {value !== "none" && (
        <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm leading-6 text-[var(--color-text-muted)]">
          After you submit, you&apos;ll go to secure Stripe checkout to pay for featuring. Your
          event listing is saved either way. Paid featuring appears on the homepage right away for
          all visitors — no subscription required to view it.
        </p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
