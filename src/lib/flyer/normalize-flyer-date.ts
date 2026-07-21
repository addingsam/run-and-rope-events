export interface NormalizedFlyerDate {
  date: string;
  yearInferred: boolean;
}

export function flyerDateStringHasYear(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return true;
  }

  if (/\b(19|20)\d{2}\b/.test(trimmed)) {
    return true;
  }

  return false;
}

function formatIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const probe = new Date(year, month - 1, day);
  return (
    probe.getFullYear() === year &&
    probe.getMonth() === month - 1 &&
    probe.getDate() === day
  );
}

const MONTH_NAME_TO_NUMBER: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

function parseNamedMonthDate(value: string, year: number): string {
  const match = value.trim().match(/^([A-Za-z]+)\s+(\d{1,2})(?:,?\s+((?:19|20)\d{2}))?$/);
  if (!match) {
    return "";
  }

  const month = MONTH_NAME_TO_NUMBER[match[1].toLowerCase()];
  const day = Number(match[2]);
  const explicitYear = match[3] ? Number(match[3]) : year;

  if (!month || !isValidCalendarDate(explicitYear, month, day)) {
    return "";
  }

  return formatIsoDate(explicitYear, month, day);
}

function normalizeDateWithExplicitYear(value: string): string {
  const trimmed = value.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    return isValidCalendarDate(year, month, day)
      ? formatIsoDate(year, month, day)
      : "";
  }

  const usWithYear = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (usWithYear) {
    const month = Number(usWithYear[1]);
    const day = Number(usWithYear[2]);
    const year = Number(usWithYear[3]);
    return isValidCalendarDate(year, month, day) ? formatIsoDate(year, month, day) : "";
  }

  const namedWithYear = parseNamedMonthDate(trimmed, 0);
  if (namedWithYear && flyerDateStringHasYear(trimmed)) {
    return namedWithYear;
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    const date = new Date(parsed);
    return formatIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  return "";
}

function parseMonthDayWithoutYear(value: string, referenceYear: number): string {
  const trimmed = value.trim();

  const numericMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})$/);
  if (numericMatch) {
    const month = Number(numericMatch[1]);
    const day = Number(numericMatch[2]);
    if (isValidCalendarDate(referenceYear, month, day)) {
      return formatIsoDate(referenceYear, month, day);
    }
  }

  const named = parseNamedMonthDate(trimmed, referenceYear);
  if (named) {
    return named;
  }

  const parsed = Date.parse(`${trimmed}, ${referenceYear}`);
  if (!Number.isNaN(parsed)) {
    const date = new Date(parsed);
    if (date.getFullYear() === referenceYear) {
      return formatIsoDate(referenceYear, date.getMonth() + 1, date.getDate());
    }
  }

  return "";
}

/**
 * Normalizes a flyer date string for form fields.
 * When the flyer omits a year, the local calendar year from referenceDate is
 * applied (defaults to the user's browser time when apply runs client-side).
 */
export function normalizeFlyerDate(
  value: string | null,
  referenceDate: Date = new Date(),
): NormalizedFlyerDate {
  if (!value?.trim()) {
    return { date: "", yearInferred: false };
  }

  const trimmed = value.trim();

  if (flyerDateStringHasYear(trimmed)) {
    return { date: normalizeDateWithExplicitYear(trimmed), yearInferred: false };
  }

  const referenceYear = referenceDate.getFullYear();
  const inferred = parseMonthDayWithoutYear(trimmed, referenceYear);
  if (inferred) {
    return { date: inferred, yearInferred: true };
  }

  return { date: normalizeDateWithExplicitYear(trimmed), yearInferred: false };
}

export interface ResolvedFlyerEventDates {
  startDate: string;
  endDate: string;
  startYearInferred: boolean;
  endYearInferred: boolean;
}

/**
 * Maps extracted flyer start/end strings onto form date fields.
 * Single-day events (start present, end omitted) use the same date for both fields.
 */
export function resolveFlyerEventDates(
  extractedStart: string | null,
  extractedEnd: string | null,
  currentStart: string,
  currentEnd: string,
  referenceDate: Date = new Date(),
): ResolvedFlyerEventDates {
  const start = normalizeFlyerDate(extractedStart, referenceDate);
  const end = normalizeFlyerDate(extractedEnd, referenceDate);
  const resolvedStart = start.date || currentStart;

  if (!start.date) {
    return {
      startDate: resolvedStart,
      endDate: end.date || currentEnd,
      startYearInferred: false,
      endYearInferred: Boolean(extractedEnd && end.yearInferred && end.date),
    };
  }

  if (!extractedEnd) {
    return {
      startDate: resolvedStart,
      endDate: start.date,
      startYearInferred: Boolean(extractedStart && start.yearInferred),
      endYearInferred: Boolean(extractedStart && start.yearInferred),
    };
  }

  if (!end.date) {
    return {
      startDate: resolvedStart,
      endDate: start.date,
      startYearInferred: Boolean(extractedStart && start.yearInferred),
      endYearInferred: Boolean(extractedStart && start.yearInferred),
    };
  }

  const sameDay = end.date === start.date;

  return {
    startDate: resolvedStart,
    endDate: sameDay ? start.date : end.date,
    startYearInferred: Boolean(extractedStart && start.yearInferred),
    endYearInferred: sameDay
      ? Boolean(extractedStart && start.yearInferred)
      : Boolean(extractedEnd && end.yearInferred),
  };
}

export function normalizeFlyerDateList(
  values: string[],
  referenceDate: Date = new Date(),
): { dates: string[]; yearInferred: boolean[] } {
  const dates: string[] = [];
  const yearInferred: boolean[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = normalizeFlyerDate(value, referenceDate);
    if (!normalized.date || seen.has(normalized.date)) {
      continue;
    }

    seen.add(normalized.date);
    dates.push(normalized.date);
    yearInferred.push(normalized.yearInferred);
  }

  const paired = dates.map((date, index) => ({
    date,
    yearInferred: yearInferred[index],
  }));
  paired.sort((left, right) => left.date.localeCompare(right.date));

  return {
    dates: paired.map((item) => item.date),
    yearInferred: paired.map((item) => item.yearInferred),
  };
}

const HTML_DATE_VALUE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDateParts(iso: string) {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function isValidHtmlDateInputValue(value: string): boolean {
  const parts = parseIsoDateParts(value);
  if (!parts) {
    return false;
  }

  return isValidCalendarDate(parts.year, parts.month, parts.day);
}

/** Ensures date form values are valid ISO calendar dates or empty. */
export function sanitizeHtmlDateInputValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const candidate = HTML_DATE_VALUE_PATTERN.test(trimmed)
    ? trimmed
    : normalizeFlyerDate(trimmed).date;

  return candidate && isValidHtmlDateInputValue(candidate) ? candidate : "";
}
