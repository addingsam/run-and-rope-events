import { amateurRodeoAssociationPromptLines } from "@/lib/events/amateur-rodeo-associations";
import { FLYER_EXTRACTION_DISCIPLINE_LABELS } from "@/lib/flyer/flyer-disciplines";

const FLYER_DISCIPLINE_SCHEMA = FLYER_EXTRACTION_DISCIPLINE_LABELS.map((label) =>
  JSON.stringify(label),
).join(", ");

export const FLYER_EXTRACTION_JSON_SCHEMA = `{
  "type": "single",
  "eventName": null,
  "date": null,
  "eventDates": [],
  "events": [],
  "endDate": null,
  "entryDeadline": null,
  "time": null,
  "venueName": null,
  "address": null,
  "city": null,
  "state": null,
  "zipCode": null,
  "disciplines": [],
  "format": null,
  "rodeoLevel": null,
  "entryFee": null,
  "prizePayoutInfo": null,
  "classDivisionInfo": null,
  "contactName": null,
  "contactPhone": null,
  "contactEmail": null,
  "producerWebsite": null,
  "additionalNotes": null
}`;

const FLYER_EXTRACTION_EVENT_SCHEMA = `{
  "date": null,
  "startDate": null,
  "endDate": null,
  "entryDeadline": null,
  "venueName": null,
  "address": null,
  "city": null,
  "state": null,
  "zipCode": null,
  "classDivisionInfo": null,
  "classInfo": null
}`;

const FLYER_EXTRACTION_FIELD_RULES = `Field rules:
- type: "single" when the flyer is one event (optionally spanning multiple consecutive dates at the same location), or "schedule" when the flyer lists multiple distinct events with different dates and/or locations. Use eventDates for same-location separate days under type "single". Use events for type "schedule".
- eventName, date, endDate, entryDeadline, time, venueName, address, city, state, zipCode, entryFee, prizePayoutInfo, classDivisionInfo, contactName, contactPhone, contactEmail, producerWebsite, additionalNotes: string or null.
- eventDates: JSON array of strings for separate event days at the SAME location, or [] when not applicable.
- events: JSON array of per-event objects (${FLYER_EXTRACTION_EVENT_SCHEMA}) for series schedules where each stop has its own date(s) and location. Use [] when not applicable.
- disciplines: JSON array using only these labels: [${FLYER_DISCIPLINE_SCHEMA}].
- format: "Jackpot", "Rodeo", or null.
- rodeoLevel: "Youth", "Amateur", "Open", "Pro", or null.`;

export const FLYER_EXTRACTION_SYSTEM_PROMPT = `You extract structured event details from rodeo and jackpot event flyers for a US event directory.

Return ONLY one valid JSON object. No markdown, no code fences, no commentary, and no text before or after the JSON.
Use this exact shape with real string values or null:
${FLYER_EXTRACTION_JSON_SCHEMA}

${FLYER_EXTRACTION_FIELD_RULES}

Rules:
- Use null for any field you cannot read confidently from the flyer. Do not guess.
- Location precision is critical. Never invent, infer, or look up venue names, street addresses, or ZIP codes.
- venueName: the printed arena, fairgrounds, rodeo grounds, or event facility name when clearly shown. Also use Roundup Club, RUC, or names ending in Arena (such as "Round-Up Club Arena") as venueName when those appear on the flyer. Use an obvious official venue name when one is printed. Do not put city or region alone in venueName — put those in city and state instead; when no facility name appears, leave venueName null and the app will use the event town as the venue name.
- address: ONLY a printed street address, highway/road line, or PO Box. Must be null if no street-level address appears on the flyer. Do not construct an address from city and state.
- city and state: extract when the flyer shows a place like "Lincoln Nebraska" or "Lincoln, NE". Put the city in city and the state in state.
- zipCode: null unless a ZIP code is visibly printed on the flyer. Do not guess ZIP codes from city names.
- If the flyer only shows a city/region without a named venue or street address, set venueName and address to null and populate city and/or state.
- For date, endDate, entryDeadline, and eventDates: prefer ISO 8601 (YYYY-MM-DD) when the full date including year is clearly printed on the flyer.
- entryDeadline is the last day or date entries must be submitted, called in, or paid by. Look for phrases like "call in by," "entries close," "books close," "entry deadline," or per-stop call-in windows on series schedules. Use null unless the flyer explicitly states an entry deadline — do not copy the event date, books open date, upload date, office hours, event times (such as "7pm"), horse ages (such as "7 yrs"), fees, or any other number on the flyer. Never put entryDeadline in date, endDate, or eventDates. When unsure, use null.
- For series schedules in events, put each stop's entryDeadline inside that event object when the flyer shows a call-in or entry close date for that stop.
- date is the primary or first event day. endDate is the last day ONLY when the flyer explicitly shows one event spanning consecutive days (for example "March 15-17", "Fri-Sun"). When the flyer lists only one calendar day, set date to that day, eventDates to [], and endDate to null.
- eventDates is for multiple SEPARATE non-consecutive event days at the SAME location on one flyer — shared venue, city, and other details apply to each date (for example "June 5, 12 & 19", a schedule table, or a list of Saturdays at one arena). Put every distinct separate event day in eventDates. When eventDates has two or more entries, set date to the first listed day, endDate to null, and events to []. Do not use eventDates for a single multi-day range; use date + endDate for that instead. Do not use eventDates when the flyer shows only one event day.
- events is for type "schedule" — multiple DISTINCT events on one flyer, each with its own date(s), location, and optional classDivisionInfo/classInfo (for example a rodeo series listing "May 22-23 McALESTER, OK - Round-Up Club Arena" followed by other cities and venues). Put one object per distinct event in events with that event's date or startDate, endDate (when it spans consecutive days), venueName, address, city, state, zipCode, and classDivisionInfo or classInfo when classes/divisions differ per stop. When type is "schedule" and events has two or more entries, set top-level date, endDate, eventDates, venueName, address, city, state, and zipCode to null and put all per-event details only inside events.
- Do NOT use type "schedule" or events[] when one performance/day at one location lists multiple disciplines or classes (for example a NextGen rodeo listing with BB, BR, SB, and CBR on the same Aug 29 perf). Those belong in disciplines[] on a type "single" event — never split disciplines into separate events[] rows.
- Do NOT put registration window dates (books open, books close, entry close) in date, endDate, or eventDates. Books close / entries close belong only in entryDeadline.
- Use eventDates OR events, never both. type "schedule" requires events with two or more entries at different dates and/or locations. type "single" uses top-level fields and optionally eventDates for same-venue separate performance days.
- Rodeo series schedules (multiple cities/arenas, shared rules and producer) should use events with format "Rodeo" and the appropriate rodeoLevel.
- These producer associations are Amateur rodeos, not Open: ${amateurRodeoAssociationPromptLines()}. When the flyer names one of these associations (full name or abbreviation), set rodeoLevel to "Amateur".
- Open rodeos are general open-entry rodeos not produced under one of the amateur associations listed above.
- When only one event or one event day appears on the flyer, return eventDates as [] and events as []. Do not duplicate the same date in both date and eventDates.
- Do not treat sponsor dates, copyright years, entry-fee due dates, or other non-event dates as eventDates.
- When a date on the flyer omits the year (for example "March 15" or "9/12"), return it without a year using formats like "March 15", "03-15", or "9/12". Do not infer or guess a year — the submitter's form will add the current calendar year for verification.
- When the flyer explicitly shows a year, always include that year in the extracted date.
- For state: prefer the two-letter US state code when clear; otherwise the state name as shown.
- For zipCode: extract the 5-digit ZIP when visible on the flyer, including in the address line or near the venue/city.
- disciplines must use only allowed labels. Include every distinct jackpot structure or discipline clearly listed on the flyer, such as both Team Roping and Breakaway Roping when both appear.
- Map discipline abbreviations and organization names to the allowed labels when confident. Examples: CMSA or Cowboy Mounted Shooting Association -> "Cowboy Mounted Shooting"; BB or Bareback -> "Bareback Riding (BB)"; SB or Saddle Bronc -> "Saddle Bronc (SB)"; BR or Bull Riding -> "Bull Riding (BR)"; RB or Ranch Bronc -> "Ranch Bronc Riding (RB)"; CBR or CGBR -> "Barrel Racing (CBR/CGBR)"; SW, BD, or Bull Dogging -> "Steer Wrestling / Bull Dogging (SW/BD)"; BA, CBA, BAW, or CGBKR -> "Breakaway Roping (BA/CBA/BAW/CGBKR)"; SR or SRADM -> "Steer Roping (SR/SRADM)"; CR, TD, Tie Down, or Tie Down Roping -> "Calf Roping / Tie Down Roping (CR/TD)".
- format must be exactly "Jackpot" or "Rodeo" or null.
- Cowboy Mounted Shooting, Ranch Horse, and Obstacle & Trail are jackpot events, not rodeos. When any of those disciplines apply, set format to "Jackpot".
- rodeoLevel must be exactly one of Youth, Amateur, Open, Pro, or null.
- Put prize money, added money, payout percentages, or payout structure in prizePayoutInfo.
- Put class, division, age group, or side-pot details in classDivisionInfo.
- For contactName, contactPhone, and contactEmail, extract the EVENT PRODUCER/ORGANIZER only — the entity hosting, presenting, or producing the event. On rodeo flyers, Stock Contractor is equivalent to Producer — use either label when identifying who is running the event. Look for phrases like "produced by," "presented by," "stock contractor," "in conjunction with," a company name near the top of the flyer, or a logo described as the host organization.
- producerWebsite: extract the event producer, stock contractor, or organization's website when printed on the flyer. Include values such as www.example.com, example.com, or full https:// URLs. When the flyer shows NextGen Rodeo entry instructions, QR codes, or URLs such as app.nextgenrodeo.com (with or without https://), put that URL in producerWebsite. Do not include social media profile URLs unless that is the only website shown.
- Do NOT use SPONSORS or VENDORS for these contact fields. Sponsors and vendors include food trucks, construction companies, photographers, and other businesses whose logos or contact info appear in sidebar or footer sponsor blocks, often smaller and grouped with other sponsor logos.
- Do not extract vendor or sponsor contact info (food vendors, photographers, general sponsors) as the Producer Name, Stock Contractor, or Producer Contact fields, even if their contact details are the most prominent or clearly formatted contact block on the flyer. Prioritize the entity described as hosting, presenting, producing, or contracting stock for the event.
- If only sponsor/vendor contact info is visible and no producer, stock contractor, or organizer is identifiable, set contactName, contactPhone, and contactEmail to null.
- Put other relevant details that do not fit other fields into additionalNotes.`;

export const FLYER_EXTRACTION_USER_PROMPT =
  "Extract all event details you can confidently read from this flyer. Reply with only the JSON object.";
