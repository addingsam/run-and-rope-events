import Link from "next/link";
import { notFound } from "next/navigation";
import { DISCIPLINE_LABELS } from "@/lib/constants";
import { sampleEvents } from "@/lib/events/sample-events";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return sampleEvents.map((event) => ({ id: event.id }));
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const event = sampleEvents.find((item) => item.id === id);

  if (!event) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/events" className="text-sm font-semibold text-amber-800 hover:text-amber-950">
        ← Back to events
      </Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-amber-700">
        {DISCIPLINE_LABELS[event.discipline]}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-amber-950">{event.title}</h1>
      <dl className="mt-6 space-y-2 text-amber-900/80">
        <div>
          <dt className="font-semibold text-amber-950">Date</dt>
          <dd>{event.startDate}</dd>
        </div>
        <div>
          <dt className="font-semibold text-amber-950">Location</dt>
          <dd>
            {event.venue}, {event.city}, {event.state}
          </dd>
        </div>
        {event.entryFee != null && (
          <div>
            <dt className="font-semibold text-amber-950">Entry fee</dt>
            <dd>${event.entryFee}</dd>
          </div>
        )}
      </dl>
      {event.description && (
        <p className="mt-6 leading-7 text-amber-900/75">{event.description}</p>
      )}
    </div>
  );
}
