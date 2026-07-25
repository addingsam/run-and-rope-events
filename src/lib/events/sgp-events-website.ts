import { normalizeWebsiteUrl } from "@/lib/events/normalize-website-url";

export const SGP_EVENTS_WEBSITE = "https://www.sgpevents.net";

const SGP_EVENTS_URL_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:[\w-]+\.)*sgpevents\.(?:com|net)(?:\/[^\s,;:!?)\\]"']*)?/gi;

const SGP_EVENTS_BRANDING_REGEXES = [
  /\bthe\s+sgp\s+logo\b/i,
  /\bsgp\s+events\b/i,
  /\bsgpevents\.net\b/i,
  /\bsgpevents\b/i,
  /\bsgp\b/i,
] as const;

function stripTrailingPunctuation(value: string) {
  return value.replace(/[.,;:!?)\]"']+$/g, "");
}

function isSgpEventsHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "sgpevents.com" ||
    normalized === "www.sgpevents.com" ||
    normalized === "sgpevents.net" ||
    normalized === "www.sgpevents.net" ||
    normalized.endsWith(".sgpevents.com") ||
    normalized.endsWith(".sgpevents.net")
  );
}

export function rewriteSgpEventsWebsite(value: string): string | null {
  const normalized = normalizeWebsiteUrl(value);
  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);
    if (isSgpEventsHostname(url.hostname)) {
      return SGP_EVENTS_WEBSITE;
    }
  } catch {
    return null;
  }

  return null;
}

function collectSgpEventsUrls(combined: string): string[] {
  const urls: string[] = [];

  for (const match of combined.matchAll(SGP_EVENTS_URL_REGEX)) {
    const index = match.index ?? 0;
    if (index > 0 && combined[index - 1] === "@") {
      continue;
    }

    urls.push(SGP_EVENTS_WEBSITE);
  }

  return urls;
}

export function extractSgpEventsWebsiteFromText(
  ...texts: Array<string | null | undefined>
): string | null {
  const combined = texts.filter(Boolean).join("\n").trim();
  if (!combined) {
    return null;
  }

  if (collectSgpEventsUrls(combined).length > 0) {
    return SGP_EVENTS_WEBSITE;
  }

  if (SGP_EVENTS_BRANDING_REGEXES.some((pattern) => pattern.test(combined))) {
    return SGP_EVENTS_WEBSITE;
  }

  return null;
}
