import Link from "next/link";

export const metadata = {
  title: "Subscription confirmed",
};

export default function SubscribeSuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-emerald-950">Payment received</h1>
        <p className="mt-3 text-sm text-emerald-900/80">
          Thanks for subscribing. Your account will unlock as soon as Stripe confirms the
          subscription — usually within a few seconds.
        </p>
        <Link
          href="/events"
          className="mt-6 inline-flex rounded-full bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-800"
        >
          Go to events
        </Link>
      </div>
    </div>
  );
}
