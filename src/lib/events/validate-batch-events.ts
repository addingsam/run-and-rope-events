import type { BatchEventEntry } from "@/types/event-submission";

export function validateBatchEvents(events: BatchEventEntry[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const normalized = events.filter(
    (event) =>
      event.startDate.trim() ||
      event.endDate.trim() ||
      event.venueName.trim() ||
      event.city.trim() ||
      event.state.trim(),
  );

  if (normalized.length < 2) {
    errors.batchEvents = "Add at least two events to submit a series listing.";
    return errors;
  }

  const today = new Date().toISOString().slice(0, 10);

  normalized.forEach((event, index) => {
    const startDate = event.startDate.trim();
    const endDate = event.endDate.trim();

    if (!startDate) {
      errors[`batchEvents.${index}.startDate`] = "Start date is required.";
    } else if (startDate < today) {
      errors[`batchEvents.${index}.startDate`] = "Start date must be today or in the future.";
    }

    if (endDate && startDate && endDate < startDate) {
      errors[`batchEvents.${index}.endDate`] = "End date must be on or after the start date.";
    }

    if (!event.venueName.trim()) {
      errors[`batchEvents.${index}.venueName`] = "Venue or arena name is required.";
    }

    if (!event.city.trim()) {
      errors[`batchEvents.${index}.city`] = "City is required.";
    }

    if (!event.state.trim()) {
      errors[`batchEvents.${index}.state`] = "State is required.";
    }
  });

  return errors;
}
