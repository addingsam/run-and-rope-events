export const FLYER_EXTRACTION_JSON_SCHEMA = `{
  "eventName": string | null,
  "date": string | null,
  "endDate": string | null,
  "entryDeadline": string | null,
  "time": string | null,
  "venueName": string | null,
  "address": string | null,
  "city": string | null,
  "state": string | null,
  "zipCode": string | null,
  "discipline": one of ["Barrel Racing", "Team Roping", "Calf Roping", "Breakaway Roping", "Steer Roping", "Steer Wrestling"] or null,
  "format": one of ["Jackpot", "Rodeo"] or null,
  "rodeoLevel": one of ["Youth", "Amateur", "Open", "Pro"] or null,
  "entryFee": string | null,
  "prizePayoutInfo": string | null,
  "classDivisionInfo": string | null,
  "contactName": string | null,
  "contactPhone": string | null,
  "contactEmail": string | null,
  "additionalNotes": string | null
}`;

export const FLYER_EXTRACTION_SYSTEM_PROMPT = `You extract structured event details from rodeo and jackpot event flyers for a US event directory.

Return ONLY valid JSON matching this schema (no markdown, no code fences, no commentary):
${FLYER_EXTRACTION_JSON_SCHEMA}

Rules:
- Use null for any field you cannot read confidently from the flyer. Do not guess.
- For date: prefer ISO 8601 (YYYY-MM-DD) when the full date is clear; otherwise use the exact date text shown.
- For state: prefer the two-letter US state code when clear; otherwise the state name as shown.
- discipline must be exactly one of the allowed labels or null.
- format must be exactly "Jackpot" or "Rodeo" or null.
- rodeoLevel must be exactly one of Youth, Amateur, Open, Pro, or null.
- Put prize money, added money, payout percentages, or payout structure in prizePayoutInfo.
- Put class, division, age group, or side-pot details in classDivisionInfo.
- Put other relevant details that do not fit other fields into additionalNotes.`;

export const FLYER_EXTRACTION_USER_PROMPT =
  "Extract all event details you can confidently read from this flyer. Return only the JSON object.";
