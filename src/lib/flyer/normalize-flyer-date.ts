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

function normalizeDateWithExplicitYear(value: string): string {
  const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    return isoMatch[1];
  }

  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }

  return "";
}

function parseMonthDayWithoutYear(value: string, referenceYear: number): string {
  const trimmed = value.trim();

  const numericMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})$/);
  if (numericMatch) {
    const month = Number(numericMatch[1]);
    const day = Number(numericMatch[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return formatIsoDate(referenceYear, month, day);
    }
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
