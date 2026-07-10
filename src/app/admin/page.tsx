import { AdminEventPanel } from "@/components/admin/AdminEventPanel";
import { getAdminDashboardStats } from "@/lib/admin/stats";
import {
  APPROVED_STATUSES,
  listEventsByStatus,
} from "@/lib/events/admin-repository";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const [stats, pendingEvents, approvedEvents, rejectedEvents] = await Promise.all([
    getAdminDashboardStats(),
    listEventsByStatus("pending"),
    listEventsByStatus(APPROVED_STATUSES),
    listEventsByStatus("rejected"),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-900">Event moderation</h1>
      <p className="mt-2 max-w-3xl text-stone-700">
        Review submitted events, approve listings for subscribers, or reject submissions
        that do not meet listing guidelines.
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
        <AdminEventPanel
          pendingEvents={pendingEvents}
          approvedEvents={approvedEvents}
          rejectedEvents={rejectedEvents}
        />
      </div>
    </div>
  );
}
