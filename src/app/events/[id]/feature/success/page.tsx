import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventForFeaturingCheckout } from "@/lib/events/featured-events";
import { isEventCurrentlyFeatured } from "@/lib/events/map-record-to-rodeo-event";
import { syncFeaturedPlacementFromCheckoutSession } from "@/lib/stripe/sync-featured-checkout";

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
      <h1 className="text-3xl font-bold text-amber-950">
        {isFeatured ? "Featured placement active" : "Payment received"}
      </h1>
      <p className="mt-4 text-base leading-7 text-amber-900/75">
        {isFeatured ? (
          <>
            <span className="font-semibold text-amber-950">{event.event_name}</span> is now featured
            on the homepage for all visitors, including those without a subscription.
          </>
        ) : (
          <>
            Thanks for your payment. Featured placement for{" "}
            <span className="font-semibold text-amber-950">{event.event_name}</span> should appear
            shortly once Stripe confirms checkout.
          </>
        )}
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/"
          className="rounded-full bg-amber-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
        >
          View homepage
        </Link>
        <Link
          href="/submit"
          className="rounded-full border border-amber-300 bg-white px-6 py-3 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-50"
        >
          Submit another event
        </Link>
      </div>
    </div>
  );
}
