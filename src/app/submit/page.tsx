import { EventSubmissionForm } from "@/components/submit/EventSubmissionForm";

export const metadata = {
  title: "Submit Event",
};

export default function SubmitPage() {
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
            Add your barrel racing or roping event to the directory. Fill out the details below
            and we&apos;ll get it in front of riders looking for their next run.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <EventSubmissionForm />
      </div>
    </div>
  );
}
