import Link from "next/link";
import { notFound } from "next/navigation";
import { FeatureEventCheckoutButton } from "@/components/events/FeatureEventCheckoutButton";
import { APP_NAME } from "@/lib/constants";
import {
  canPurchaseFeaturedPlacement,
  getEventForFeaturingCheckout,
} from "@/lib/events/featured-events";
import { isEventCurrentlyFeatured } from "@/lib/events/map-record-to-rodeo-event";
import { FEATURED_PLACEMENT } from "@/lib/stripe/featured";

interface FeatureEventPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ canceled?: string }>;
}

export async function generateMetadata({ params }: FeatureEventPageProps) {
  const { id } = await params;
  const event = await getEventForFeaturingCheckout(id).catch(() => null);

  return {
    title: event ? `Feature ${event.event_name}` : "Feature event",
  };
}

export default async function FeatureEventPage({ params, searchParams }: FeatureEventPageProps) {
  const { id } = await params;
  const { canceled } = await searchParams;
  const event = await getEventForFeaturingCheckout(id).catch(() => null);

  if (!event) {
    notFound();
  }

  const isFeatured = isEventCurrentlyFeatured(event);
  const canPurchase = canPurchaseFeaturedPlacement(event);
  const receiptEmail = event.submitter_email ?? event.contact_email ?? "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
        Producer promotion
      </p>
      <h1 className="mt-2 text-3xl font-bold text-amber-950">Feature your event</h1>
      <p className="mt-4 text-base leading-7 text-amber-900/75">
        Put <span className="font-semibold text-amber-950">{event.event_name}</span> on the{" "}
        {APP_NAME} homepage where every visitor can see it — including people without a paid
        subscription.
      </p>

      {canceled && (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Checkout canceled. You can try again when you&apos;re ready.
        </p>
      )}

      <div className="mt-8 rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-bold text-amber-950">{FEATURED_PLACEMENT.priceLabel}</p>
            <p className="mt-1 text-sm text-amber-900/70">Homepage featuring options</p>
          </div>
          {isFeatured && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
              Currently featured
            </span>
          )}
        </div>

        <ul className="mt-6 space-y-2 text-sm text-amber-900/80">
          <li>Featured events section on the main homepage</li>
          <li>Visible to every visitor, including non-subscribers</li>
          <li>{FEATURED_PLACEMENT.oneTimeLabel}</li>
          <li>{FEATURED_PLACEMENT.recurringLabel}</li>
        </ul>

        <div className="mt-8">
          {canPurchase ? (
            <FeatureEventCheckoutButton
              eventId={event.id}
              eventTitle={event.event_name}
              email={receiptEmail}
            />
          ) : (
            <p className="text-sm text-amber-900/75">
              This event already has active featured placement through{" "}
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(new Date(event.featured_until!))}
              .
            </p>
          )}
        </div>
      </div>

      <p className="mt-6 text-sm text-amber-900/70">
        Standard directory listing is free. Featuring is an optional paid upgrade that starts once
        payment is complete and your event is approved.
      </p>

      <Link
        href={`/events/${event.id}`}
        className="mt-6 inline-flex text-sm font-semibold text-amber-800 hover:text-amber-950"
      >
        Back to event details →
      </Link>
    </div>
  );
}
