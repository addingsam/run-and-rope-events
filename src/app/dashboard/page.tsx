import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SavedEventsPanel } from "@/components/dashboard/SavedEventsPanel";
import { SavedSearchesPanel } from "@/components/dashboard/SavedSearchesPanel";
import { getAuthUserProfile } from "@/lib/auth/get-user";
import { listSavedEvents } from "@/lib/saved-events/repository";
import { listSavedSearches } from "@/lib/saved-searches/repository";
import { buildSavedSearchPreviewItems } from "@/lib/saved-searches/saved-search-preview";
import { runSavedSearch } from "@/lib/saved-searches/run-saved-search";
import { getIsSubscriber } from "@/lib/subscription/status";

export const metadata = {
  title: "Your profile",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  const profile = await getAuthUserProfile();
  const isSubscriber = await getIsSubscriber();
  if (!profile) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  if (!isSubscriber) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-amber-950">Subscription required</h1>
          <p className="mt-3 text-sm text-amber-900/70">
            Saved searches and saved events are available to subscribers.
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

  const [searches, events] = await Promise.all([
    listSavedSearches(profile.id),
    listSavedEvents(profile.id),
  ]);

  const savedSearchItems = await Promise.all(
    searches.map(async (search) => {
      const response = await runSavedSearch(search.search_params, search.map_overlay);
      return {
        search,
        preview: buildSavedSearchPreviewItems(response.results),
        matchCount: response.results.length,
      };
    }),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Your profile</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Signed in as {profile.email}. Review saved searches, change update frequency, and manage
          bookmarked events.
        </p>
        <Link
          href="/submit"
          className="mt-4 inline-flex rounded-full border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-100"
        >
          Submit your event - Free
        </Link>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Saved searches</h2>
          <Link
            href="/events"
            className="text-sm font-semibold text-[var(--color-accent-primary)] hover:text-[var(--color-text-primary)]"
          >
            New search
          </Link>
        </div>
        <SavedSearchesPanel initialItems={savedSearchItems} />
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Saved events</h2>
        <SavedEventsPanel initialEvents={events} />
      </section>
    </div>
  );
}
