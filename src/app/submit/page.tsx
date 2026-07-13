import { EventSubmissionForm } from "@/components/submit/EventSubmissionForm";
import { syncFeaturedPlacementFromCheckoutSession } from "@/lib/stripe/sync-featured-checkout";
import { themeMutedTextClassName, themePanelClassName } from "@/lib/theme/form-classes";

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
      <div className="border-b border-[var(--color-border)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--background)]">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent-primary)]">
            List your event
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Submit an event
          </h1>
          <p className="mt-4 inline-flex rounded-full border border-emerald-400/40 bg-emerald-950/30 px-4 py-2 text-sm font-semibold text-emerald-300">
            Free to list — no charge
          </p>
          <p className={`mt-4 max-w-2xl text-base leading-7 sm:text-lg ${themeMutedTextClassName}`}>
            Upload your flyer first — we&apos;ll read it and pre-fill the form. Then review the
            details, complete anything that&apos;s missing, and submit. Listing your event in the
            directory is completely free. No account or payment is required.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {featuredSuccess && (
          <div className="mb-6 rounded-2xl border border-emerald-400/40 bg-emerald-950/30 px-5 py-4 text-sm leading-6 text-emerald-300">
            Payment received. Your event is submitted and homepage featuring is active. It should
            appear on the main page right away for all visitors, including those without a
            subscription.
          </div>
        )}
        {featuredCanceled && (
          <div
            className={`mb-6 px-5 py-4 text-sm leading-6 text-[var(--color-text-muted)] ${themePanelClassName}`}
          >
            Your event was saved, but featured checkout was canceled. You can submit another event
            with featuring, or add it later after approval.
          </div>
        )}
        <EventSubmissionForm />
      </div>
    </div>
  );
}
