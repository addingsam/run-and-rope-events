import { EventCard } from "@/components/events/EventCard";
import { sampleEvents } from "@/lib/events/sample-events";

export const metadata = {
  title: "Events",
};

export default function EventsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-bold text-amber-950">Event directory</h1>
        <p className="mt-3 text-amber-900/75">
          Search barrel racing and roping events by discipline, state, and date.
          Subscription members unlock nationwide search, alerts, and organizer tools.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sampleEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
