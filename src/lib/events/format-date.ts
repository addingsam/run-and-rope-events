export function formatEventDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function formatEventDateRange(startDate: string, endDate?: string | null) {
  if (!endDate || endDate === startDate) {
    return formatEventDate(startDate);
  }

  return `${formatEventDate(startDate)} – ${formatEventDate(endDate)}`;
}
