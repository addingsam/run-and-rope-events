"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveEventAction,
  rejectEventAction,
} from "@/app/admin/actions";
import { AdminEventEditDialog } from "@/components/admin/AdminEventEditDialog";
import { DuplicateComparisonPanel } from "@/components/admin/DuplicateComparisonPanel";
import { formatEventDate } from "@/lib/events/format-date";
import {
  formatDisciplineLabels,
  getFormatLabel,
  getRodeoLevelLabel,
} from "@/lib/events/submission-options";
import type { PendingEventReview } from "@/lib/events/duplicate-detection";
import type { EventRecord } from "@/types/event-record";
import type { RodeoLevel, SubmissionFormat } from "@/types/event-submission";

type AdminTab = "pending" | "approved" | "rejected";

interface AdminEventPanelProps {
  pendingEventReviews: PendingEventReview[];
  approvedEvents: EventRecord[];
  rejectedEvents: EventRecord[];
}

function formatLocation(event: EventRecord) {
  const cityLine = [event.address_city, event.address_state].filter(Boolean).join(", ");
  if (event.venue_name) {
    return `${event.venue_name} · ${cityLine}`;
  }
  return cityLine;
}

function EventRow({
  event,
  duplicates,
  showActions,
  onEdit,
  onActionComplete,
}: {
  event: EventRecord;
  duplicates: EventRecord[];
  showActions: boolean;
  onEdit: (event: EventRecord) => void;
  onActionComplete: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const format = (event.event_format as SubmissionFormat) ?? "jackpot";
  const hasDuplicates = duplicates.length > 0;

  function handleApprove() {
    if (
      hasDuplicates &&
      !window.confirm(
        `This submission may duplicate an existing event. Approve "${event.event_name}" anyway?`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      await approveEventAction(event.id);
      onActionComplete();
    });
  }

  function handleReject() {
    if (!window.confirm(`Reject "${event.event_name}"?`)) {
      return;
    }

    startTransition(async () => {
      await rejectEventAction(event.id);
      onActionComplete();
    });
  }

  return (
    <>
      <tr className={`border-b align-top ${hasDuplicates ? "border-amber-200 bg-amber-50/40" : "border-stone-200"}`}>
        <td className="px-4 py-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-stone-900">{event.event_name}</p>
              {event.source === "scrape" && (
                <span className="rounded-full border border-sky-300 bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-950">
                  Scraped — needs review
                </span>
              )}
              {hasDuplicates && (
                <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
                  Possible duplicate
                </span>
              )}
            </div>
            {event.flyer_url && (
              <a
                href={event.flyer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
              >
                <img
                  src={event.flyer_url}
                  alt={`Flyer for ${event.event_name}`}
                  className="h-14 w-10 rounded border border-stone-200 object-cover"
                />
                <span>View flyer</span>
              </a>
            )}
          </div>
        </td>
        <td className="px-4 py-4 text-sm text-stone-700">{getFormatLabel(format)}</td>
        <td className="px-4 py-4 text-sm text-stone-700">
          {format === "rodeo" && event.rodeo_level
            ? getRodeoLevelLabel(event.rodeo_level as RodeoLevel)
            : "—"}
        </td>
        <td className="px-4 py-4 text-sm text-stone-700">
          {event.disciplines?.length
            ? formatDisciplineLabels(event.disciplines as Parameters<typeof formatDisciplineLabels>[0])
            : "—"}
        </td>
        <td className="px-4 py-4 text-sm text-stone-700">
          {formatEventDate(event.event_date)}
        </td>
        <td className="px-4 py-4 text-sm text-stone-700">{formatLocation(event)}</td>
        <td className="px-4 py-4 text-sm text-stone-700">
          {event.submitter_email ?? "—"}
        </td>
        <td className="px-4 py-4 text-sm text-stone-700">
          {formatEventDate(event.created_at.slice(0, 10))}
        </td>
        {showActions && (
          <td className="px-4 py-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={handleApprove}
                className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onEdit(event)}
                className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-900 hover:bg-stone-50 disabled:opacity-60"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleReject}
                className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </td>
        )}
      </tr>
      {hasDuplicates && showActions && (
        <tr className="border-b border-amber-200 bg-amber-50/20">
          <td colSpan={9} className="px-4 py-4">
            <DuplicateComparisonPanel submission={event} duplicates={duplicates} />
          </td>
        </tr>
      )}
    </>
  );
}

export function AdminEventPanel({
  pendingEventReviews,
  approvedEvents,
  rejectedEvents,
}: AdminEventPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("pending");
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);

  const duplicateCount = pendingEventReviews.filter((review) => review.duplicates.length > 0).length;

  const tabs: { id: AdminTab; label: string; count: number; hint?: string }[] = [
    {
      id: "pending",
      label: "Pending",
      count: pendingEventReviews.length,
      hint: duplicateCount > 0 ? `${duplicateCount} possible duplicate${duplicateCount === 1 ? "" : "s"}` : undefined,
    },
    { id: "approved", label: "Approved", count: approvedEvents.length },
    { id: "rejected", label: "Rejected", count: rejectedEvents.length },
  ];

  function handleActionComplete() {
    router.refresh();
  }

  return (
    <>
      <div className="border-b border-stone-300">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "border-stone-900 text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              {tab.label} ({tab.count})
              {tab.hint && (
                <span className="ml-2 text-xs font-medium text-amber-700">· {tab.hint}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-300 bg-white shadow-sm">
        <table className="min-w-full text-left">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Format</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Disciplines</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Submitter</th>
              <th className="px-4 py-3">Submitted</th>
              {activeTab === "pending" && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {activeTab === "pending" && pendingEventReviews.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-stone-500">
                  No pending events.
                </td>
              </tr>
            )}

            {activeTab === "approved" && approvedEvents.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-stone-500">
                  No approved events.
                </td>
              </tr>
            )}

            {activeTab === "rejected" && rejectedEvents.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-stone-500">
                  No rejected events.
                </td>
              </tr>
            )}

            {activeTab === "pending" &&
              pendingEventReviews.map((review) => (
                <EventRow
                  key={review.event.id}
                  event={review.event}
                  duplicates={review.duplicates}
                  showActions
                  onEdit={setEditingEvent}
                  onActionComplete={handleActionComplete}
                />
              ))}

            {activeTab === "approved" &&
              approvedEvents.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  duplicates={[]}
                  showActions={false}
                  onEdit={setEditingEvent}
                  onActionComplete={handleActionComplete}
                />
              ))}

            {activeTab === "rejected" &&
              rejectedEvents.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  duplicates={[]}
                  showActions={false}
                  onEdit={setEditingEvent}
                  onActionComplete={handleActionComplete}
                />
              ))}
          </tbody>
        </table>
      </div>

      {editingEvent && (
        <AdminEventEditDialog
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSaved={handleActionComplete}
        />
      )}
    </>
  );
}
