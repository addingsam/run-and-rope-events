import { EventSubmissionForm } from "@/components/submit/EventSubmissionForm";
import { syncFeaturedPlacementFromCheckoutSession } from "@/lib/stripe/sync-featured-checkout";

export const metadata = {
  title: "Submit Event",
};

interface SubmitPageProps {
  searchParams: Promise<{
    featured_success?: string;
    featured_canceled?: string;
    event_id?: string;
    session_id?: string;
  }>;
}

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const params = await searchParams;

  if (params.session_id) {
    await syncFeaturedPlacementFromCheckoutSession(params.session_id).catch((error) => {
      console.error("Failed to sync featured checkout session:", error);
    });
  }
  const featuredSuccess = params.featured_success === "1";
  const featuredCanceled = params.featured_canceled === "1";

  return (
    <div className="bg-[var(--background)]">
      <div className="border-b border-amber-200/60 bg-gradient-to-b from-amber-100/50 to-[var(--background)]">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            List your event
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-amber-950 sm:text-4xl">
            Submit an event
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-amber-900/75 sm:text-lg">
            List your jackpots and rodeos across barrel racing, team roping, calf roping, breakaway
            roping, steer roping, steer wrestling, cowboy mounted shooting, ranch horse, obstacle
            &amp; trail, and more. No account is required. You can optionally add paid homepage featuring during submission.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {featuredSuccess && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-900">
            Payment received. Your event is submitted and homepage featuring is active. It should
            appear on the main page right away for all visitors, including those without a
            subscription.
          </div>
        )}
        {featuredCanceled && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
            Your event was saved, but featured checkout was canceled. You can submit another event
            with featuring, or add it later after approval.
          </div>
        )}
        <EventSubmissionForm />
      </div>
    </div>
  );
}
