import { normalizeWebsiteUrl } from "@/lib/events/normalize-website-url";

export const NEXTGEN_RODEO_WEBSITE = "https://app.nextgenrodeo.com";

const NEXTGEN_RODEO_URL_REGEX =
  /(?:https?:\/\/)?(?:[\w-]+\.)*nextgenrodeo\.com(?:\/[^\s,;:!?)\\]"']*)?/gi;

const NEXTGEN_RODEO_BRANDING_REGEX = /\bnext[\s-]?gen[\s-]?rodeo\b/i;

function stripTrailingPunctuation(value: string) {
  return value.replace(/[.,;:!?)\]"']+$/g, "");
}

function collectNextGenRodeoUrls(combined: string): string[] {
  const urls: string[] = [];

  for (const match of combined.matchAll(NEXTGEN_RODEO_URL_REGEX)) {
    const index = match.index ?? 0;
    if (index > 0 && combined[index - 1] === "@") {
      continue;
    }

    const normalized = normalizeWebsiteUrl(stripTrailingPunctuation(match[0]));
    if (normalized) {
      urls.push(normalized);
    }
  }

  return urls;
}

function pickPreferredNextGenRodeoUrl(urls: string[]): string | null {
  if (urls.length === 0) {
    return null;
  }

  const unique = [...new Set(urls)];
  unique.sort((left, right) => right.length - left.length);
  return unique[0] ?? null;
}

export function extractNextGenRodeoWebsiteFromText(
  ...texts: Array<string | null | undefined>
): string | null {
  const combined = texts.filter(Boolean).join("\n").trim();
  if (!combined) {
    return null;
  }

  const explicitUrl = pickPreferredNextGenRodeoUrl(collectNextGenRodeoUrls(combined));
  if (explicitUrl) {
    return explicitUrl;
  }

  if (NEXTGEN_RODEO_BRANDING_REGEX.test(combined)) {
    return NEXTGEN_RODEO_WEBSITE;
  }

  return null;
}
