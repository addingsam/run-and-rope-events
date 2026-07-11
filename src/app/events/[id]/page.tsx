import { notFound } from "next/navigation";
import { EventDetailContent } from "@/components/events/EventDetailContent";
import { canPurchaseFeaturedPlacement } from "@/lib/events/featured-events";
import { mapEventRecordToEventDetail } from "@/lib/events/event-detail";
import { getPubliclyViewableEventById } from "@/lib/events/get-event-by-id";
import { sampleEvents } from "@/lib/events/sample-events";
import type { EventDetailView } from "@/types/event-detail";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

function sampleToEventDetail(sample: (typeof sampleEvents)[number]): EventDetailView {
  return {
    id: sample.id,
    title: sample.title,
    format: sample.format,
    rodeoLevel: null,
    disciplines: sample.disciplines,
    startDate: sample.startDate,
    endDate: sample.endDate ?? null,
    venue: sample.venue,
    city: sample.city,
    state: sample.state,
    entryFee: sample.entryFee ?? null,
    producerName: sample.organizerName ?? null,
    websiteUrl: sample.websiteUrl ?? null,
    additionalOfferings: sample.additionalOfferings ?? [],
    description: sample.description ?? null,
  };
}

export async function generateMetadata({ params }: EventDetailPageProps) {
  const { id } = await params;
  const record = await getPubliclyViewableEventById(id).catch(() => null);
  const sample = sampleEvents.find((item) => item.id === id);
  const title = record?.event_name ?? sample?.title ?? "Event";

  return {
    title,
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;

  const record = await getPubliclyViewableEventById(id).catch(() => null);
  let event: EventDetailView | null = null;
  let showFeaturePlacementCta = false;

  if (record) {
    event = mapEventRecordToEventDetail(record);
    showFeaturePlacementCta = canPurchaseFeaturedPlacement(record);
  } else {
    const sample = sampleEvents.find((item) => item.id === id);
    if (!sample) {
      notFound();
    }

    event = sampleToEventDetail(sample);
  }

  return <EventDetailContent event={event} showFeaturePlacementCta={showFeaturePlacementCta} />;
}
