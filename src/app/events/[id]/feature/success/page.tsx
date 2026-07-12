import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventForFeaturingCheckout } from "@/lib/events/featured-events";
import { isEventCurrentlyFeatured } from "@/lib/events/map-record-to-rodeo-event";
import { syncFeaturedPlacementFromCheckoutSession } from "@/lib/stripe/sync-featured-checkout";
import {
  themeMutedTextClassName,
  themePrimaryButtonClassName,
  themeSecondaryButtonClassName,
} from "@/lib/theme/form-classes";

interface FeatureSuccessPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export default async function FeatureSuccessPage({
  params,
  searchParams,
}: FeatureSuccessPageProps) {
  const { id } = await params;
  const { session_id: sessionId } = await searchParams;

  if (sessionId) {
    await syncFeaturedPlacementFromCheckoutSession(sessionId).catch((error) => {
      console.error("Failed to sync featured checkout session:", error);
    });
  }

  const event = await getEventForFeaturingCheckout(id).catch(() => null);

  if (!event) {
    notFound();
  }

  const isFeatured = isEventCurrentlyFeatured(event);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
        {isFeatured ? "Featured placement active" : "Payment received"}
      </h1>
      <p className={`mt-4 text-base leading-7 ${themeMutedTextClassName}`}>
        {isFeatured ? (
          <>
            <span className="font-semibold text-[var(--color-text-primary)]">{event.event_name}</span> is now featured
            on the homepage for all visitors, including those without a subscription.
          </>
        ) : (
          <>
            Thanks for your payment. Featured placement for{" "}
            <span className="font-semibold text-[var(--color-text-primary)]">{event.event_name}</span> should appear
            shortly once Stripe confirms checkout.
          </>
        )}
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/"
          className={`px-6 py-3 ${themePrimaryButtonClassName}`}
        >
          View homepage
        </Link>
        <Link
          href="/submit"
          className={`px-6 py-3 ${themeSecondaryButtonClassName}`}
        >
          Submit another event
        </Link>
      </div>
    </div>
  );
}
