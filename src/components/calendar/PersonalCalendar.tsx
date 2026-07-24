"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ManualEntryDialog } from "@/components/calendar/ManualEntryDialog";
import { itemOccursOnDate, toDateKey } from "@/lib/calendar/build-calendar-items";
import {
  createCalendarEntry,
  deleteCalendarEntry,
  updateCalendarEntry,
} from "@/lib/calendar/client";
import { removeSavedEvent } from "@/lib/saved/client";
import { formatEventDate, formatEventDateRange } from "@/lib/events/format-date";
import {
  themePanelClassName,
  themePrimaryButtonClassName,
  themeSecondaryButtonClassName,
} from "@/lib/theme/form-classes";
import type { CalendarEntryInput, CalendarItem } from "@/types/calendar-entry";

interface PersonalCalendarProps {
  initialItems: CalendarItem[];
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTimeLabel(time: string | null) {
  if (!time) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));
}

function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ date: Date | null; key: string }> = [];

  for (let index = 0; index < startOffset; index += 1) {
    cells.push({ date: null, key: `empty-start-${index}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    cells.push({ date, key: toDateKey(date) });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, key: `empty-end-${cells.length}` });
  }

  return cells;
}

function isArchivedStatus(status: string) {
  return status !== "approved" && status !== "published";
}

export function PersonalCalendar({ initialItems }: PersonalCalendarProps) {
  const today = new Date();
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth());
  const [items, setItems] = useState(initialItems);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(toDateKey(today));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<(CalendarEntryInput & { id: string }) | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const monthCells = useMemo(
    () => buildMonthGrid(visibleYear, visibleMonth),
    [visibleYear, visibleMonth],
  );

  const selectedItems = useMemo(() => {
    if (!selectedDateKey) {
      return [];
    }
    return items.filter((item) => itemOccursOnDate(item, selectedDateKey));
  }, [items, selectedDateKey]);

  function shiftMonth(delta: number) {
    const next = new Date(visibleYear, visibleMonth + delta, 1);
    setVisibleYear(next.getFullYear());
    setVisibleMonth(next.getMonth());
  }

  function openCreateDialog(dateKey?: string) {
    setEditingEntry(null);
    setDialogOpen(true);
    if (dateKey) {
      setSelectedDateKey(dateKey);
    }
  }

  function openEditDialog(item: Extract<CalendarItem, { kind: "manual_entry" }>) {
    setEditingEntry({
      id: item.id,
      title: item.title,
      entry_date: item.date,
      entry_time: item.time ?? "",
      note: item.note ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSaveEntry(input: CalendarEntryInput) {
    setError(null);
    if (editingEntry?.id) {
      const updated = await updateCalendarEntry(editingEntry.id, input);
      setItems((current) =>
        current.map((item) =>
          item.kind === "manual_entry" && item.id === updated.id
            ? {
                kind: "manual_entry",
                id: updated.id,
                title: updated.title,
                date: updated.entry_date,
                time: updated.entry_time,
                note: updated.note,
                created_at: updated.created_at,
                updated_at: updated.updated_at,
              }
            : item,
        ),
      );
      setSelectedDateKey(updated.entry_date);
      return;
    }

    const created = await createCalendarEntry(input);
    setItems((current) => [
      ...current,
      {
        kind: "manual_entry",
        id: created.id,
        title: created.title,
        date: created.entry_date,
        time: created.entry_time,
        note: created.note,
        created_at: created.created_at,
        updated_at: created.updated_at,
      },
    ]);
    setSelectedDateKey(created.entry_date);
  }

  async function handleDeleteManualEntry(entryId: string) {
    setError(null);
    setPendingKey(`manual:${entryId}`);
    try {
      await deleteCalendarEntry(entryId);
      setItems((current) => current.filter((item) => !(item.kind === "manual_entry" && item.id === entryId)));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete entry.");
    } finally {
      setPendingKey(null);
    }
  }

  async function handleRemoveSavedEvent(eventId: string) {
    setError(null);
    setPendingKey(`saved:${eventId}`);
    try {
      await removeSavedEvent(eventId);
      setItems((current) =>
        current.filter((item) => !(item.kind === "saved_event" && item.event_id === eventId)),
      );
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Failed to remove saved event.");
    } finally {
      setPendingKey(null);
    }
  }

  const dialogInitialValues =
    editingEntry ??
    (selectedDateKey
      ? {
          title: "",
          entry_date: selectedDateKey,
          entry_time: "",
          note: "",
        }
      : undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            {monthLabel(visibleYear, visibleMonth)}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Saved site events and your personal entries in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className={themeSecondaryButtonClassName}
            aria-label="Previous month"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setVisibleYear(now.getFullYear());
              setVisibleMonth(now.getMonth());
              setSelectedDateKey(toDateKey(now));
            }}
            className={themeSecondaryButtonClassName}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className={themeSecondaryButtonClassName}
            aria-label="Next month"
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => openCreateDialog(selectedDateKey ?? undefined)}
            className={themePrimaryButtonClassName}
          >
            Add entry
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className={`${themePanelClassName} overflow-hidden`}>
        <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-background)]">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthCells.map((cell) => {
            if (!cell.date) {
              return (
                <div
                  key={cell.key}
                  className="min-h-24 border-b border-r border-[var(--color-border)] bg-[var(--color-background)]/60"
                />
              );
            }

            const dateKey = toDateKey(cell.date);
            const dayItems = items.filter((item) => itemOccursOnDate(item, dateKey));
            const isSelected = selectedDateKey === dateKey;
            const isToday = dateKey === toDateKey(today);

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDateKey(dateKey)}
                className={`min-h-24 border-b border-r border-[var(--color-border)] p-2 text-left transition-colors hover:bg-[var(--color-background)] ${
                  isSelected ? "bg-[var(--color-accent-primary)]/10" : "bg-[var(--color-surface)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                      isToday
                        ? "bg-[var(--color-accent-cta)] text-[var(--color-background)]"
                        : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                  {dayItems.length > 0 && (
                    <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                      {dayItems.length}
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1">
                  {dayItems.slice(0, 2).map((item) => (
                    <p
                      key={`${item.kind}-${item.id}`}
                      className={`truncate rounded-md px-1.5 py-0.5 text-xs font-medium ${
                        item.kind === "saved_event"
                          ? "bg-[var(--color-accent-primary)]/15 text-[var(--color-text-primary)]"
                          : "bg-amber-100 text-amber-950"
                      }`}
                    >
                      {item.title}
                    </p>
                  ))}
                  {dayItems.length > 2 && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      +{dayItems.length - 2} more
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {selectedDateKey ? formatEventDate(selectedDateKey) : "Select a day"}
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              {selectedItems.length === 0
                ? "No events or entries on this day."
                : `${selectedItems.length} item${selectedItems.length === 1 ? "" : "s"}`}
            </p>
          </div>
          {selectedDateKey && (
            <button
              type="button"
              onClick={() => openCreateDialog(selectedDateKey)}
              className={themeSecondaryButtonClassName}
            >
              Add entry for this day
            </button>
          )}
        </div>

        {selectedItems.length === 0 ? (
          <div className={`${themePanelClassName} p-6 text-sm text-[var(--color-text-muted)]`}>
            Bookmark events from search results or add a manual entry to start building your
            calendar.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedItems.map((item) => {
              if (item.kind === "manual_entry") {
                const timeLabel = formatTimeLabel(item.time);
                return (
                  <article key={`manual-${item.id}`} className={`${themePanelClassName} p-5`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">
                            {item.title}
                          </h4>
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-950">
                            Personal entry
                          </span>
                        </div>
                        {timeLabel && (
                          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{timeLabel}</p>
                        )}
                        {item.note && (
                          <p className="mt-2 text-sm text-[var(--color-text-primary)]">{item.note}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditDialog(item)}
                          className={themeSecondaryButtonClassName}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={pendingKey === `manual:${item.id}`}
                          onClick={() => void handleDeleteManualEntry(item.id)}
                          className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }

              const archived = isArchivedStatus(item.status);
              return (
                <article key={`saved-${item.id}`} className={`${themePanelClassName} p-5`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">
                          {item.title}
                        </h4>
                        <span className="rounded-full bg-[var(--color-accent-primary)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--color-text-primary)]">
                          Saved event
                        </span>
                        {archived && (
                          <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-800">
                            Archived
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        {item.location ? `${item.location} · ` : ""}
                        {formatEventDateRange(item.date, item.end_date)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!archived && (
                        <Link
                          href={`/events/${item.event_id}`}
                          className={themeSecondaryButtonClassName}
                        >
                          View event
                        </Link>
                      )}
                      <button
                        type="button"
                        disabled={pendingKey === `saved:${item.event_id}`}
                        onClick={() => void handleRemoveSavedEvent(item.event_id)}
                        className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <ManualEntryDialog
        open={dialogOpen}
        initialValues={dialogInitialValues}
        onClose={() => {
          setDialogOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
      />
    </div>
  );
}
