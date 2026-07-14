export function validateBatchEventDates(dates: string[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const normalized = dates.map((date) => date.trim()).filter(Boolean);

  if (normalized.length < 2) {
    errors.eventDates = "Add at least two dates to submit multiple events at once.";
    return errors;
  }

  const today = new Date().toISOString().slice(0, 10);
  const seen = new Set<string>();

  normalized.forEach((date, index) => {
    if (seen.has(date)) {
      errors[`eventDates.${index}`] = "This date is already listed.";
      return;
    }

    seen.add(date);

    if (date < today) {
      errors[`eventDates.${index}`] = "Each event date must be today or in the future.";
    }
  });

  return errors;
}
