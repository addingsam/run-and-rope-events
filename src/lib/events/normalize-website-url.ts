const COMMON_TLDS =
  "com|net|org|edu|gov|io|co|us|info|biz|me|tv|xyz|live|online|site|store|app|rocks|rodeo|events|horse|pro|club";

const WEBSITE_IN_TEXT_REGEX = new RegExp(
  `(?:https?:\\/\\/)?(?:www\\.)?[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\\.(?:${COMMON_TLDS})\\b(?:\\/[^\\s,;:!?)\\]"']*)?`,
  "gi",
);

function stripTrailingPunctuation(value: string) {
  return value.replace(/[.,;:!?)\]"']+$/g, "");
}

export function normalizeWebsiteUrl(value: string): string {
  const trimmed = stripTrailingPunctuation(value.trim());
  if (!trimmed) {
    return "";
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }

    return url.href.replace(/\/$/, "");
  } catch {
    return "";
  }
}

export function isValidWebsiteUrl(value: string): boolean {
  const normalized = normalizeWebsiteUrl(value);
  if (!normalized) {
    return false;
  }

  try {
    const url = new URL(normalized);
    return /\.[a-z]{2,}$/i.test(url.hostname);
  } catch {
    return false;
  }
}

export function extractWebsiteFromText(
  ...texts: Array<string | null | undefined>
): string | null {
  const combined = texts.filter(Boolean).join("\n");
  if (!combined.trim()) {
    return null;
  }

  for (const match of combined.matchAll(WEBSITE_IN_TEXT_REGEX)) {
    const index = match.index ?? 0;
    if (index > 0 && combined[index - 1] === "@") {
      continue;
    }

    const normalized = normalizeWebsiteUrl(match[0]);
    if (isValidWebsiteUrl(normalized)) {
      return normalized;
    }
  }

  return null;
}
