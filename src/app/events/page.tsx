import { Suspense } from "react";
import { EventSearchPage } from "@/components/events/search/EventSearchPage";

export const metadata = {
  title: "Events",
};

export default function EventsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-bold text-amber-950">Event directory</h1>
        <p className="mt-3 text-amber-900/75">
          Search barrel racing and roping events by format, discipline, location, and date.
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
          isSubscriber
          isAuthenticated
          mapboxToken={process.env.MAPBOX_ACCESS_TOKEN ?? ""}
        />
      </Suspense>
    </div>
  );
}
