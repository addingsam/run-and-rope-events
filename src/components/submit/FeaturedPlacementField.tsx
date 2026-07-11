import { FEATURED_PLACEMENT } from "@/lib/stripe/featured";
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
    title: "Standard listing only",
    description: "Submit your event to the directory at no extra cost.",
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
        <h3 className="text-base font-semibold text-amber-950">Homepage featuring (optional)</h3>
        <p className="mt-2 text-sm leading-6 text-amber-900/75">
          {FEATURED_PLACEMENT.description} Featured events appear on the main homepage in the
          Featured events section and are visible to everyone — including visitors without a paid
          subscription.
        </p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer gap-3 rounded-2xl border px-4 py-4 transition-colors ${
                selected
                  ? "border-amber-500 bg-amber-50"
                  : "border-amber-200 bg-white hover:border-amber-300"
              }`}
            >
              <input
                type="radio"
                name="featurePlacement"
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="mt-1 h-4 w-4 border-amber-300 text-amber-700 focus:ring-amber-500"
              />
              <span>
                <span className="block text-sm font-semibold text-amber-950">{option.title}</span>
                <span className="mt-1 block text-sm leading-6 text-amber-900/75">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {value !== "none" && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900/80">
          After you submit, you&apos;ll go to secure Stripe checkout to pay for featuring. Your
          event listing is saved either way. Paid featuring appears on the homepage right away for
          all visitors — no subscription required to view it.
        </p>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
