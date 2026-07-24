import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PersonalCalendar } from "@/components/calendar/PersonalCalendar";
import { getAuthUserProfile } from "@/lib/auth/get-user";
import { buildCalendarItems } from "@/lib/calendar/build-calendar-items";
import { listCalendarEntries } from "@/lib/calendar-entries/repository";
import { listSavedEvents } from "@/lib/saved-events/repository";
import { getIsSubscriber } from "@/lib/subscription/status";

export const metadata = {
  title: "Your calendar",
};

export default async function CalendarPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard/calendar");
  }

  const profile = await getAuthUserProfile();
  const isSubscriber = await getIsSubscriber();
  if (!profile) {
    redirect("/sign-in?redirect_url=/dashboard/calendar");
  }

  if (!isSubscriber) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-amber-950">Subscription required</h1>
          <p className="mt-3 text-sm text-amber-900/70">
            Your personal calendar is available to subscribers.
          </p>
          <Link
            href="/subscribe"
            className="mt-6 inline-flex rounded-full bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-800"
          >
            View plans
          </Link>
        </div>
      </div>
    );
  }

  const [savedEvents, manualEntries] = await Promise.all([
    listSavedEvents(profile.id),
    listCalendarEntries(profile.id),
  ]);
  const items = buildCalendarItems(savedEvents, manualEntries);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Your calendar</h1>
          <p className="mt-2 text-[var(--color-text-muted)]">
            Saved events and personal entries for {profile.email}.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-background)]"
        >
          Back to profile
        </Link>
      </div>

      <PersonalCalendar initialItems={items} />
    </div>
  );
}
