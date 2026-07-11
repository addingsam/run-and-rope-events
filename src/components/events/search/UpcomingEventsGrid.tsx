"use client";

import { LockedEventCard } from "@/components/events/search/LockedEventCard";
import { SubscriberEventCard } from "@/components/events/search/SubscriberEventCard";
import type { EventSearchResultItem } from "@/types/event-search";

interface UpcomingEventsGridProps {
  events: EventSearchResultItem[];
  countLabel: string;
  emptyTitle: string;
  emptyMessage: string;
  isSubscriber: boolean;
  selectedKey: string | null;
  onSelectCard: (key: string) => void;
  onCardRef: (key: string, element: HTMLDivElement | null) => void;
}

function getUpcomingCardKey(event: EventSearchResultItem, isSubscriber: boolean) {
  if (!isSubscriber) {
    return `state:${event.state.toUpperCase()}`;
  }

  return `event:${event.id}`;
}

export function UpcomingEventsGrid({
  events,
  countLabel,
  emptyTitle,
  emptyMessage,
  isSubscriber,
  selectedKey,
  onSelectCard,
  onCardRef,
}: UpcomingEventsGridProps) {
  function handleCardClick(
    clickEvent: React.MouseEvent<HTMLDivElement>,
    key: string,
  ) {
    const target = clickEvent.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, label")) {
      return;
    }

    onSelectCard(key);
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-amber-950">Matching events</h2>
        <p className="mt-1 text-sm text-amber-900/70">{countLabel}</p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-white px-5 py-10 text-center">
          <p className="text-lg font-semibold text-amber-950">{emptyTitle}</p>
          <p className="mt-2 text-sm text-amber-900/70">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const key = getUpcomingCardKey(event, isSubscriber);
            const isSelected = selectedKey === key;

            return (
              <div
                key={key}
                ref={(element) => onCardRef(key, element)}
                onClick={(clickEvent) => handleCardClick(clickEvent, key)}
                className={`rounded-2xl transition-shadow ${
                  isSelected ? "ring-2 ring-amber-500 ring-offset-2" : ""
                }`}
              >
                {isSubscriber ? (
                  <SubscriberEventCard event={event} />
                ) : (
                  <LockedEventCard event={event} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
