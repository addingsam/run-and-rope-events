import { AdminPanel } from "@/components/admin/AdminPanel";
import { getAdminDashboardStats } from "@/lib/admin/stats";
import {
  APPROVED_STATUSES,
  listEventsByStatus,
  listEventsForDuplicateCheck,
} from "@/lib/events/admin-repository";
import { buildPendingEventReviews } from "@/lib/events/duplicate-detection";
import { listProRodeos } from "@/lib/pro-rodeos/repository";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const [stats, pendingEvents, approvedEvents, rejectedEvents, duplicateCandidates, proRodeos] =
    await Promise.all([
      getAdminDashboardStats(),
      listEventsByStatus("pending"),
      listEventsByStatus(APPROVED_STATUSES),
      listEventsByStatus("rejected"),
      listEventsForDuplicateCheck(),
      listProRodeos(),
    ]);

  const pendingEventReviews = buildPendingEventReviews(pendingEvents, duplicateCandidates);

  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-900">Admin panel</h1>
      <p className="mt-2 max-w-3xl text-stone-700">
        Review submitted events and manage WPRA/PRCA pro rodeo listings.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-300 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-stone-500">Approved events</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{stats.approvedEvents}</p>
        </div>
        <div className="rounded-2xl border border-stone-300 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-stone-500">Pending submissions</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{stats.pendingSubmissions}</p>
        </div>
        <div className="rounded-2xl border border-stone-300 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-stone-500">Active subscribers</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{stats.activeSubscribers}</p>
        </div>
      </div>

      <div className="mt-10">
        <AdminPanel
          pendingEventReviews={pendingEventReviews}
          approvedEvents={approvedEvents}
          rejectedEvents={rejectedEvents}
          proRodeos={proRodeos}
        />
      </div>
    </div>
  );
}
