"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProRodeoAction } from "@/app/admin/pro-rodeo-actions";
import { AdminProRodeoFormDialog } from "@/components/admin/AdminProRodeoFormDialog";
import { formatEventDate } from "@/lib/events/format-date";
import type { ProRodeoRecord } from "@/types/pro-rodeo-record";

interface AdminProRodeoPanelProps {
  proRodeos: ProRodeoRecord[];
}

function ProRodeoRow({
  proRodeo,
  onEdit,
  onActionComplete,
}: {
  proRodeo: ProRodeoRecord;
  onEdit: (proRodeo: ProRodeoRecord) => void;
  onActionComplete: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Delete "${proRodeo.rodeo_name}"?`)) {
      return;
    }

    startTransition(async () => {
      await deleteProRodeoAction(proRodeo.id);
      onActionComplete();
    });
  }

  return (
    <tr className="border-b border-stone-200 align-top">
      <td className="px-4 py-4 font-medium text-stone-900">{proRodeo.rodeo_name}</td>
      <td className="px-4 py-4 text-sm text-stone-700">{proRodeo.sanctioning_body}</td>
      <td className="px-4 py-4 text-sm text-stone-700">{proRodeo.city}</td>
      <td className="px-4 py-4 text-sm text-stone-700">{proRodeo.state}</td>
      <td className="px-4 py-4 text-sm text-stone-700">
        {formatEventDate(proRodeo.start_date)}
      </td>
      <td className="px-4 py-4 text-sm text-stone-700">
        {proRodeo.end_date ? formatEventDate(proRodeo.end_date) : "—"}
      </td>
      <td className="px-4 py-4 text-sm">
        <a
          href={proRodeo.external_link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-stone-700 underline decoration-stone-300 underline-offset-2 hover:text-stone-900"
        >
          View link
        </a>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onEdit(proRodeo)}
            className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-900 hover:bg-stone-50 disabled:opacity-60"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export function AdminProRodeoPanel({ proRodeos }: AdminProRodeoPanelProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProRodeo, setEditingProRodeo] = useState<ProRodeoRecord | null>(null);

  function handleActionComplete() {
    router.refresh();
  }

  function openCreateDialog() {
    setEditingProRodeo(null);
    setDialogOpen(true);
  }

  function openEditDialog(proRodeo: ProRodeoRecord) {
    setEditingProRodeo(proRodeo);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingProRodeo(null);
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-stone-600">
          {proRodeos.length} pro rodeo listing{proRodeos.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={openCreateDialog}
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
        >
          Add new
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-stone-300 bg-white shadow-sm">
        <table className="min-w-full text-left">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Rodeo name</th>
              <th className="px-4 py-3">Sanctioning body</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Start date</th>
              <th className="px-4 py-3">End date</th>
              <th className="px-4 py-3">External link</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {proRodeos.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-stone-500">
                  No pro rodeo listings yet.
                </td>
              </tr>
            ) : (
              proRodeos.map((proRodeo) => (
                <ProRodeoRow
                  key={proRodeo.id}
                  proRodeo={proRodeo}
                  onEdit={openEditDialog}
                  onActionComplete={handleActionComplete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {dialogOpen && (
        <AdminProRodeoFormDialog
          proRodeoId={editingProRodeo?.id}
          onClose={closeDialog}
          onSaved={handleActionComplete}
        />
      )}
    </>
  );
}
