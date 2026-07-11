import { Suspense } from "react";
import { EventSearchPage } from "@/components/events/search/EventSearchPage";
import { getIsSubscriber } from "@/lib/auth/get-user";
import {
  listFutureMapEvents,
  listUpcomingEvents,
} from "@/lib/events/list-future-map-events";

export const metadata = {
  title: "Events",
};

export default async function EventsPage() {
  const [isSubscriber, upcomingEvents, mapResults] = await Promise.all([
    getIsSubscriber(),
    listUpcomingEvents(),
    listFutureMapEvents(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-bold text-amber-950">Event directory</h1>
        <p className="mt-3 text-amber-900/75">
          Browse upcoming jackpots and rodeos by date, then search the map by format, discipline,
          location, and date.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="rounded-2xl border border-amber-200 bg-white p-6 text-sm text-amber-900/70">
            Loading search…
          </div>
        }
      >
        <EventSearchPage
          isSubscriber={isSubscriber}
          mapboxToken={process.env.MAPBOX_ACCESS_TOKEN ?? ""}
          initialUpcomingEvents={upcomingEvents}
          initialMapResults={mapResults}
        />
      </Suspense>
    </div>
  );
}
