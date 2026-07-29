import { normalizeWebsiteUrl } from "@/lib/events/normalize-website-url";

export const SADDLEBOOK_WEBSITE = "https://saddlebook.com";

const SADDLEBOOK_URL_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:[\w-]+\.)*saddlebook\.com(?:\/[^\s,;:!?)\\]"']*)?/gi;

const SADDLEBOOK_BRANDING_REGEXES = [
  /\bsaddlebook\.com\b/i,
  /\bsaddle[\s-]?book\b/i,
] as const;

function isSaddlebookHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "saddlebook.com" ||
    normalized === "www.saddlebook.com" ||
    normalized.endsWith(".saddlebook.com")
  );
}

export function rewriteSaddlebookWebsite(value: string): string | null {
  const normalized = normalizeWebsiteUrl(value);
  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);
    if (isSaddlebookHostname(url.hostname)) {
      return SADDLEBOOK_WEBSITE;
    }
  } catch {
    return null;
  }

  return null;
}

function collectSaddlebookUrls(combined: string): string[] {
  const urls: string[] = [];

  for (const match of combined.matchAll(SADDLEBOOK_URL_REGEX)) {
    const index = match.index ?? 0;
    if (index > 0 && combined[index - 1] === "@") {
      continue;
    }

    urls.push(SADDLEBOOK_WEBSITE);
  }

  return urls;
}

export function extractSaddlebookWebsiteFromText(
  ...texts: Array<string | null | undefined>
): string | null {
  const combined = texts.filter(Boolean).join("\n").trim();
  if (!combined) {
    return null;
  }

  if (collectSaddlebookUrls(combined).length > 0) {
    return SADDLEBOOK_WEBSITE;
  }

  if (SADDLEBOOK_BRANDING_REGEXES.some((pattern) => pattern.test(combined))) {
    return SADDLEBOOK_WEBSITE;
  }

  return null;
}
