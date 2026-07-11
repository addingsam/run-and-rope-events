"use client";

import { useMemo } from "react";
import { LockedEventCard } from "@/components/events/search/LockedEventCard";
import { SubscriberEventCard } from "@/components/events/search/SubscriberEventCard";
import { CheckboxGroup, SelectInput } from "@/components/submit/FormField";
import {
  filterUpcomingEvents,
  formatUpcomingEventsCount,
  hasActiveUpcomingFilters,
  UPCOMING_FORMAT_FILTER_OPTIONS,
  UPCOMING_RODEO_LEVEL_OPTIONS,
  type UpcomingEventFilterState,
  type UpcomingFormatFilter,
} from "@/lib/events/filter-upcoming-events";
import { DISCIPLINE_OPTIONS } from "@/lib/events/submission-options";
import type { EventSearchResultItem } from "@/types/event-search";
import type { SubmissionDiscipline } from "@/types/event-submission";

interface UpcomingEventsGridProps {
  events: EventSearchResultItem[];
  totalEventCount: number;
  hasMapOverlayFilter?: boolean;
  filterState: UpcomingEventFilterState;
  onFilterChange: (filters: UpcomingEventFilterState) => void;
  canSaveFilters: boolean;
  onSaveFilters: () => void;
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
  totalEventCount,
  hasMapOverlayFilter = false,
  filterState,
  onFilterChange,
  canSaveFilters,
  onSaveFilters,
  isSubscriber,
  selectedKey,
  onSelectCard,
  onCardRef,
}: UpcomingEventsGridProps) {
  const { formatFilter, selectedDisciplines, selectedRodeoLevels } = filterState;

  const hasActiveFilters = hasActiveUpcomingFilters(filterState);

  const filteredEvents = useMemo(
    () => filterUpcomingEvents(events, filterState),
    [events, filterState],
  );

  const countLabel = formatUpcomingEventsCount({
    matchCount: filteredEvents.length,
    totalCount: hasMapOverlayFilter ? totalEventCount : events.length,
    hasActiveFilters: hasActiveFilters || hasMapOverlayFilter,
  });

  function handleFormatFilterChange(nextFormat: UpcomingFormatFilter) {
    if (nextFormat === "jackpot") {
      onFilterChange({
        formatFilter: nextFormat,
        selectedDisciplines,
        selectedRodeoLevels: [],
      });
      return;
    }

    if (nextFormat === "rodeo") {
      onFilterChange({
        formatFilter: nextFormat,
        selectedDisciplines: [],
        selectedRodeoLevels,
      });
      return;
    }

    onFilterChange({
      formatFilter: nextFormat,
      selectedDisciplines,
      selectedRodeoLevels,
    });
  }

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

  const showDisciplineFilter = formatFilter === "jackpot" || formatFilter === "both";
  const showRodeoLevelFilter = formatFilter === "rodeo" || formatFilter === "both";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-amber-950">Upcoming events</h2>
          <p className="mt-1 text-sm text-amber-900/70">{countLabel}</p>
        </div>
        {canSaveFilters && (
          <button
            type="button"
            onClick={onSaveFilters}
            className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-50"
          >
            Save &amp; get alerts
          </button>
        )}
      </div>

      <div className="space-y-6 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
        <SelectInput
          label="Event type"
          name="upcomingFormatFilter"
          value={formatFilter}
          onChange={(event) =>
            handleFormatFilterChange(event.target.value as UpcomingFormatFilter)
          }
          options={UPCOMING_FORMAT_FILTER_OPTIONS}
        />

        {showDisciplineFilter && (
          <CheckboxGroup
            label="Jackpot disciplines"
            hint="Select one or more disciplines. Leave unchecked to include all jackpot disciplines."
            options={DISCIPLINE_OPTIONS}
            values={selectedDisciplines}
            onChange={(values) =>
              onFilterChange({
                ...filterState,
                selectedDisciplines: values as SubmissionDiscipline[],
              })
            }
          />
        )}

        {showRodeoLevelFilter && (
          <CheckboxGroup
            label="Rodeo level"
            hint="Select one or more levels. Leave unchecked to include all rodeo levels."
            options={UPCOMING_RODEO_LEVEL_OPTIONS}
            values={selectedRodeoLevels}
            onChange={(values) =>
              onFilterChange({
                ...filterState,
                selectedRodeoLevels: values,
              })
            }
          />
        )}
      </div>

      {totalEventCount === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-white px-5 py-10 text-center">
          <p className="text-lg font-semibold text-amber-950">No upcoming events</p>
          <p className="mt-2 text-sm text-amber-900/70">
            Check back soon or use the search below to explore the map.
          </p>
        </div>
      ) : filteredEvents.length === 0 && hasMapOverlayFilter && !hasActiveFilters ? (
        <div className="rounded-2xl border border-amber-200 bg-white px-5 py-10 text-center">
          <p className="text-lg font-semibold text-amber-950">No events in drawn area</p>
          <p className="mt-2 text-sm text-amber-900/70">
            None of the upcoming listings fall inside your map drawing. Adjust or clear the drawing
            on the map below.
          </p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-white px-5 py-10 text-center">
          <p className="text-lg font-semibold text-amber-950">No events match your filters</p>
          <p className="mt-2 text-sm text-amber-900/70">
            Try adjusting your selections.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => {
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
