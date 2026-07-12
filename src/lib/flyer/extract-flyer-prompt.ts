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
  "contactName": string | null,  // event producer/organizer name (not sponsors or vendors)
  "contactPhone": string | null,  // producer/organizer phone (not sponsors or vendors)
  "contactEmail": string | null,  // producer/organizer email (not sponsors or vendors)
  "additionalNotes": string | null
}`;

export const FLYER_EXTRACTION_SYSTEM_PROMPT = `You extract structured event details from rodeo and jackpot event flyers for a US event directory.

Return ONLY valid JSON matching this schema (no markdown, no code fences, no commentary):
${FLYER_EXTRACTION_JSON_SCHEMA}

Rules:
- Use null for any field you cannot read confidently from the flyer. Do not guess.
- For date: prefer ISO 8601 (YYYY-MM-DD) when the full date is clear; otherwise use the exact date text shown.
- For state: prefer the two-letter US state code when clear; otherwise the state name as shown.
- For zipCode: extract the 5-digit ZIP when visible on the flyer, including in the address line or near the venue/city.
- discipline must be exactly one of the allowed labels or null.
- format must be exactly "Jackpot" or "Rodeo" or null.
- rodeoLevel must be exactly one of Youth, Amateur, Open, Pro, or null.
- Put prize money, added money, payout percentages, or payout structure in prizePayoutInfo.
- Put class, division, age group, or side-pot details in classDivisionInfo.
- For contactName, contactPhone, and contactEmail, extract the EVENT PRODUCER/ORGANIZER only — the entity hosting, presenting, or producing the event. Look for phrases like "produced by," "presented by," "in conjunction with," a company name near the top of the flyer, or a logo described as the host organization.
- Do NOT use SPONSORS or VENDORS for these contact fields. Sponsors and vendors include food trucks, construction companies, photographers, and other businesses whose logos or contact info appear in sidebar or footer sponsor blocks, often smaller and grouped with other sponsor logos.
- Do not extract vendor or sponsor contact info (food vendors, photographers, general sponsors) as the Producer Name or Producer Contact fields, even if their contact details are the most prominent or clearly formatted contact block on the flyer. Prioritize the entity described as hosting, presenting, or producing the event.
- If only sponsor/vendor contact info is visible and no producer/organizer is identifiable, set contactName, contactPhone, and contactEmail to null.
- Put other relevant details that do not fit other fields into additionalNotes.`;

export const FLYER_EXTRACTION_USER_PROMPT =
  "Extract all event details you can confidently read from this flyer. Return only the JSON object.";
