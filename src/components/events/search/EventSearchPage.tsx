"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckboxGroup, SelectInput } from "@/components/submit/FormField";
import { EventsSearchMap } from "@/components/events/search/EventsSearchMap";
import { LocationAutocomplete } from "@/components/events/search/LocationAutocomplete";
import { LockedEventCard } from "@/components/events/search/LockedEventCard";
import { ProRodeoSearchCard } from "@/components/events/search/ProRodeoSearchCard";
import {
  RouteEventListItem,
  RouteProRodeoListItem,
} from "@/components/events/search/RouteSearchResultList";
import { SearchModeToggle } from "@/components/events/search/SearchModeToggle";
import { SubscriberEventCard } from "@/components/events/search/SubscriberEventCard";
import { getResultKey } from "@/lib/mapbox/search-map-utils";
import {
  DEFAULT_SEARCH_BUFFER,
  DEFAULT_SEARCH_RADIUS,
  SEARCH_BUFFER_OPTIONS,
  SEARCH_FORMAT_OPTIONS,
  SEARCH_RADIUS_OPTIONS,
  SEARCH_RODEO_LEVEL_OPTIONS,
} from "@/lib/events/search-options";
import { DISCIPLINE_OPTIONS } from "@/lib/events/submission-options";
import type {
  EventSearchResponse,
  RouteSearchResponse,
  SearchBufferMiles,
  SearchFormat,
  SearchMode,
  SearchRadiusMiles,
  SearchResultEntry,
  SearchRodeoLevel,
} from "@/types/event-search";
import { SaveSearchDialog } from "@/components/saved/SaveSearchDialog";
import { savedSearchParamsFromFormState } from "@/lib/saved-searches/run-saved-search";
import type { SavedMapOverlay } from "@/types/saved-search";
import type { SubmissionDiscipline } from "@/types/event-submission";

interface EventSearchPageProps {
  isSubscriber: boolean;
  isAuthenticated: boolean;
  mapboxToken: string;
}

interface SearchFormState {
  mode: SearchMode;
  format: SearchFormat;
  rodeoLevel: SearchRodeoLevel | "";
  disciplines: SubmissionDiscipline[];
  locationLabel: string;
  lat: number | null;
  lng: number | null;
  radiusMiles: SearchRadiusMiles;
  originLabel: string;
  originLat: number | null;
  originLng: number | null;
  destinationLabel: string;
  destinationLat: number | null;
  destinationLng: number | null;
  bufferMiles: SearchBufferMiles;
  startDate: string;
  endDate: string;
}

function parseDisciplines(value: string | null): SubmissionDiscipline[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean) as SubmissionDiscipline[];
}

function parseRadius(value: string | null): SearchRadiusMiles {
  const parsed = Number(value ?? DEFAULT_SEARCH_RADIUS);
  if (parsed === 25 || parsed === 50 || parsed === 100 || parsed === 200) {
    return parsed;
  }

  return DEFAULT_SEARCH_RADIUS;
}

function parseBuffer(value: string | null): SearchBufferMiles {
  const parsed = Number(value ?? DEFAULT_SEARCH_BUFFER);
  if (parsed === 5 || parsed === 10 || parsed === 25) {
    return parsed;
  }

  return DEFAULT_SEARCH_BUFFER;
}

function parseMode(value: string | null): SearchMode {
  return value === "route" ? "route" : "radius";
}

function buildSearchParams(state: SearchFormState) {
  const params = new URLSearchParams();

  if (state.mode === "route") {
    params.set("mode", "route");
  }

  if (state.format !== "either") {
    params.set("format", state.format);
  }

  if (state.rodeoLevel) {
    params.set("rodeoLevel", state.rodeoLevel);
  }

  if (state.disciplines.length > 0) {
    params.set("disciplines", state.disciplines.join(","));
  }

  if (state.mode === "route") {
    if (state.originLabel) {
      params.set("origin", state.originLabel);
    }
    if (state.originLat !== null) {
      params.set("originLat", String(state.originLat));
    }
    if (state.originLng !== null) {
      params.set("originLng", String(state.originLng));
    }
    if (state.destinationLabel) {
      params.set("destination", state.destinationLabel);
    }
    if (state.destinationLat !== null) {
      params.set("destinationLat", String(state.destinationLat));
    }
    if (state.destinationLng !== null) {
      params.set("destinationLng", String(state.destinationLng));
    }
    params.set("buffer", String(state.bufferMiles));
  } else {
    if (state.locationLabel) {
      params.set("location", state.locationLabel);
    }
    if (state.lat !== null) {
      params.set("lat", String(state.lat));
    }
    if (state.lng !== null) {
      params.set("lng", String(state.lng));
    }
    params.set("radius", String(state.radiusMiles));
  }

  if (state.startDate) {
    params.set("startDate", state.startDate);
  }

  if (state.endDate) {
    params.set("endDate", state.endDate);
  }

  return params;
}

function stateFromSearchParams(searchParams: URLSearchParams): SearchFormState {
  return {
    mode: parseMode(searchParams.get("mode")),
    format: (searchParams.get("format") as SearchFormat | null) ?? "either",
    rodeoLevel: (searchParams.get("rodeoLevel") as SearchRodeoLevel | null) ?? "",
    disciplines: parseDisciplines(searchParams.get("disciplines")),
    locationLabel: searchParams.get("location") ?? "",
    lat: searchParams.get("lat") ? Number(searchParams.get("lat")) : null,
    lng: searchParams.get("lng") ? Number(searchParams.get("lng")) : null,
    radiusMiles: parseRadius(searchParams.get("radius")),
    originLabel: searchParams.get("origin") ?? "",
    originLat: searchParams.get("originLat") ? Number(searchParams.get("originLat")) : null,
    originLng: searchParams.get("originLng") ? Number(searchParams.get("originLng")) : null,
    destinationLabel: searchParams.get("destination") ?? "",
    destinationLat: searchParams.get("destinationLat")
      ? Number(searchParams.get("destinationLat"))
      : null,
    destinationLng: searchParams.get("destinationLng")
      ? Number(searchParams.get("destinationLng"))
      : null,
    bufferMiles: parseBuffer(searchParams.get("buffer")),
    startDate: searchParams.get("startDate") ?? "",
    endDate: searchParams.get("endDate") ?? "",
  };
}

function isRouteSearchResponse(
  response: EventSearchResponse,
): response is RouteSearchResponse {
  return "route" in response;
}

function canAutoSearch(state: SearchFormState) {
  if (state.mode === "route") {
    return Boolean(state.originLabel.trim() && state.destinationLabel.trim());
  }

  return Boolean(state.locationLabel.trim());
}

function getSelectionKey(entry: SearchResultEntry, isSubscriber: boolean) {
  if (!isSubscriber && entry.kind === "event") {
    return `state:${entry.item.state.toUpperCase()}`;
  }

  return getResultKey(entry);
}

export function EventSearchPage({
  isSubscriber,
  isAuthenticated,
  mapboxToken,
}: EventSearchPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialState = useMemo(
    () => stateFromSearchParams(searchParams),
    [searchParams],
  );

  const [formState, setFormState] = useState<SearchFormState>(initialState);
  const [results, setResults] = useState<EventSearchResponse | null>(null);
  const [routeMeta, setRouteMeta] = useState<RouteSearchResponse["route"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [originError, setOriginError] = useState<string | null>(null);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [mapOverlay, setMapOverlay] = useState<SavedMapOverlay>({
    pinRadius: null,
    shapes: [],
  });
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const resultRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const rodeoLevelEnabled =
    formState.format === "rodeo" || formState.format === "either";

  const runSearch = useCallback(async (state: SearchFormState) => {
    if (state.mode === "route") {
      if (!state.originLabel.trim()) {
        setOriginError("Enter a starting point.");
        setResults(null);
        setRouteMeta(null);
        setSelectedKey(null);
        return;
      }

      if (!state.destinationLabel.trim()) {
        setDestinationError("Enter a destination.");
        setResults(null);
        setRouteMeta(null);
        setSelectedKey(null);
        return;
      }
    } else if (!state.locationLabel.trim()) {
      setLocationError("Enter a city, state, or zip code.");
      setResults(null);
      setRouteMeta(null);
      setSelectedKey(null);
      return;
    }

    setLoading(true);
    setError(null);
    setLocationError(null);
    setOriginError(null);
    setDestinationError(null);
    setHasSearched(true);
    setSelectedKey(null);

    const params = buildSearchParams(state);

    try {
      const response = await fetch(`/api/events/search?${params.toString()}`);
      const data = (await response.json()) as (EventSearchResponse | RouteSearchResponse) & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Search failed.");
      }

      setResults(data);
      setRouteMeta(isRouteSearchResponse(data) ? data.route : null);
    } catch (searchError) {
      setResults(null);
      setRouteMeta(null);
      setError(searchError instanceof Error ? searchError.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setFormState(initialState);

    if (canAutoSearch(initialState)) {
      void runSearch(initialState);
    }
  }, [initialState, runSearch]);

  useEffect(() => {
    if (!selectedKey) {
      return;
    }

    resultRefs.current[selectedKey]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [selectedKey]);

  function updateFormState(patch: Partial<SearchFormState>) {
    setFormState((current) => {
      const next = { ...current, ...patch };

      if (patch.format === "jackpot") {
        next.rodeoLevel = "";
      }

      return next;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (formState.mode === "route") {
      if (!formState.originLabel.trim()) {
        setOriginError("Enter a starting point.");
        return;
      }

      if (!formState.destinationLabel.trim()) {
        setDestinationError("Enter a destination.");
        return;
      }
    } else if (!formState.locationLabel.trim()) {
      setLocationError("Enter a city, state, or zip code.");
      return;
    }

    const params = buildSearchParams(formState);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function renderResultCard(entry: SearchResultEntry) {
    const key = getSelectionKey(entry, isSubscriber);

    if (entry.kind === "pro_rodeo") {
      if (formState.mode === "route") {
        return <RouteProRodeoListItem proRodeo={entry.item} />;
      }

      return <ProRodeoSearchCard proRodeo={entry.item} />;
    }

    if (formState.mode === "route") {
      return <RouteEventListItem event={entry.item} isSubscriber={isSubscriber} />;
    }

    if (isSubscriber) {
      return <SubscriberEventCard event={entry.item} />;
    }

    return <LockedEventCard event={entry.item} />;
  }

  const inputClassName =
    "w-full rounded-xl border border-amber-200 bg-[#fffaf3] px-4 py-3 text-base text-amber-950 placeholder:text-amber-900/40 transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20";

  const searchCenter =
    formState.mode === "radius" && formState.lat !== null && formState.lng !== null
      ? { lat: formState.lat, lng: formState.lng }
      : null;

  const canSaveSearch =
    isSubscriber &&
    isAuthenticated &&
    hasSearched &&
    (canAutoSearch(formState) ||
      Boolean(mapOverlay.pinRadius) ||
      mapOverlay.shapes.length > 0);

  const handleMapOverlayChange = useCallback((overlay: SavedMapOverlay) => {
    setMapOverlay(overlay);
  }, []);

  return (
    <div className="space-y-8">
      <SearchModeToggle
        mode={formState.mode}
        onChange={(mode) => updateFormState({ mode })}
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <SelectInput
            label="Format"
            name="format"
            value={formState.format}
            onChange={(event) =>
              updateFormState({ format: event.target.value as SearchFormat })
            }
            options={SEARCH_FORMAT_OPTIONS}
          />

          <SelectInput
            label="Rodeo level"
            name="rodeoLevel"
            value={formState.rodeoLevel}
            onChange={(event) =>
              updateFormState({
                rodeoLevel: event.target.value as SearchRodeoLevel | "",
              })
            }
            options={SEARCH_RODEO_LEVEL_OPTIONS}
            placeholder="Any level"
            disabled={!rodeoLevelEnabled}
            className={!rodeoLevelEnabled ? "opacity-50" : ""}
          />

          <div className="lg:col-span-2">
            <CheckboxGroup
              label="Discipline"
              hint="Leave unchecked to include all disciplines."
              options={DISCIPLINE_OPTIONS}
              values={formState.disciplines}
              onChange={(disciplines) =>
                updateFormState({ disciplines: disciplines as SubmissionDiscipline[] })
              }
            />
          </div>

          {formState.mode === "radius" ? (
            <>
              <div className="lg:col-span-2">
                <LocationAutocomplete
                  label="Location"
                  value={formState.locationLabel}
                  lat={formState.lat}
                  lng={formState.lng}
                  error={locationError ?? undefined}
                  onChange={({ locationLabel, lat, lng }) =>
                    updateFormState({ locationLabel, lat, lng })
                  }
                />
              </div>

              <SelectInput
                label="Radius"
                name="radius"
                value={String(formState.radiusMiles)}
                onChange={(event) =>
                  updateFormState({
                    radiusMiles: Number(event.target.value) as SearchRadiusMiles,
                  })
                }
                options={SEARCH_RADIUS_OPTIONS}
              />
            </>
          ) : (
            <>
              <LocationAutocomplete
                inputId="origin"
                label="Starting point"
                value={formState.originLabel}
                lat={formState.originLat}
                lng={formState.originLng}
                error={originError ?? undefined}
                onChange={({ locationLabel, lat, lng }) =>
                  updateFormState({
                    originLabel: locationLabel,
                    originLat: lat,
                    originLng: lng,
                  })
                }
              />

              <LocationAutocomplete
                inputId="destination"
                label="Destination"
                value={formState.destinationLabel}
                lat={formState.destinationLat}
                lng={formState.destinationLng}
                error={destinationError ?? undefined}
                onChange={({ locationLabel, lat, lng }) =>
                  updateFormState({
                    destinationLabel: locationLabel,
                    destinationLat: lat,
                    destinationLng: lng,
                  })
                }
              />

              <SelectInput
                label="Buffer distance"
                name="buffer"
                value={String(formState.bufferMiles)}
                onChange={(event) =>
                  updateFormState({
                    bufferMiles: Number(event.target.value) as SearchBufferMiles,
                  })
                }
                options={SEARCH_BUFFER_OPTIONS}
              />
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            <div>
              <label htmlFor="startDate" className="mb-2 block text-sm font-semibold text-amber-950">
                Start date
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={formState.startDate}
                onChange={(event) => updateFormState({ startDate: event.target.value })}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="mb-2 block text-sm font-semibold text-amber-950">
                End date
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={formState.endDate}
                onChange={(event) => updateFormState({ endDate: event.target.value })}
                className={inputClassName}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="rounded-full bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-800"
          >
            {formState.mode === "route" ? "Search along route" : "Search events"}
          </button>
          {!isSubscriber && (
            <p className="text-sm text-amber-900/70">
              Pro rodeo listings are free to browse. Full event details require a subscription.
            </p>
          )}
        </div>
      </form>

      <section aria-live="polite">
        {loading && (
          <p className="text-sm text-amber-900/70">
            {formState.mode === "route"
              ? "Calculating route and searching for events…"
              : "Searching nearby events…"}
          </p>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {!loading && results && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
            <p className="text-sm font-semibold text-amber-950">
              {results.counts.total} result{results.counts.total === 1 ? "" : "s"}
              {results.counts.proRodeos > 0 && (
                <span className="font-normal text-amber-900/70">
                  {" "}
                  ({results.counts.events} listing
                  {results.counts.events === 1 ? "" : "s"}, {results.counts.proRodeos} pro rodeo
                  {results.counts.proRodeos === 1 ? "" : "s"})
                </span>
              )}
            </p>
            {routeMeta && (
              <p className="text-sm text-amber-900/70">
                Driving route: {routeMeta.distanceMiles.toFixed(1)} miles ·{" "}
                {Math.round(routeMeta.durationMinutes)} min
              </p>
            )}
            </div>

            {canSaveSearch && (
              <button
                type="button"
                onClick={() => setSaveDialogOpen(true)}
                className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-50"
              >
                Save this search
              </button>
            )}
          </div>
        )}

        {!loading && hasSearched && results?.counts.total === 0 && (
          <div className="rounded-2xl border border-amber-200 bg-white px-5 py-10 text-center">
            <p className="text-lg font-semibold text-amber-950">No events found</p>
            <p className="mt-2 text-sm text-amber-900/70">
              {formState.mode === "route"
                ? "Try widening the buffer distance, adjusting dates, or changing your filters."
                : "Try widening the radius, adjusting dates, or changing your filters."}
            </p>
          </div>
        )}

        {!loading && hasSearched && mapboxToken && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <EventsSearchMap
              mapboxToken={mapboxToken}
              results={results?.results ?? []}
              isSubscriber={isSubscriber}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              routeMeta={routeMeta}
              searchCenter={searchCenter}
              origin={
                formState.mode === "route" &&
                formState.originLat !== null &&
                formState.originLng !== null
                  ? {
                      label: formState.originLabel,
                      lat: formState.originLat,
                      lng: formState.originLng,
                    }
                  : null
              }
              destination={
                formState.mode === "route" &&
                formState.destinationLat !== null &&
                formState.destinationLng !== null
                  ? {
                      label: formState.destinationLabel,
                      lat: formState.destinationLat,
                      lng: formState.destinationLng,
                    }
                  : null
              }
              onMapOverlayChange={handleMapOverlayChange}
            />

            <div
              className={`max-h-[720px] space-y-4 overflow-y-auto pr-1 ${
                formState.mode === "radius" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-1" : ""
              }`}
            >
              {results?.results.map((entry) => {
                const key = getSelectionKey(entry, isSubscriber);
                const isSelected = selectedKey === key;

                return (
                  <div
                    key={key}
                    ref={(element) => {
                      resultRefs.current[key] = element;
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedKey(key)}
                    onKeyDown={(keyboardEvent) => {
                      if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                        keyboardEvent.preventDefault();
                        setSelectedKey(key);
                      }
                    }}
                    className={`rounded-2xl transition-shadow ${
                      isSelected ? "ring-2 ring-amber-500 ring-offset-2" : ""
                    }`}
                  >
                    {renderResultCard(entry)}
                  </div>
                );
              })}

              {results && results.results.length === 0 && (
                <div className="rounded-2xl border border-amber-200 bg-white px-5 py-10 text-center">
                  <p className="text-sm text-amber-900/70">No results to show on the map yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <SaveSearchDialog
        open={saveDialogOpen}
        searchParams={savedSearchParamsFromFormState(formState)}
        mapOverlay={
          mapOverlay.pinRadius || mapOverlay.shapes.length > 0 ? mapOverlay : null
        }
        onClose={() => setSaveDialogOpen(false)}
      />
    </div>
  );
}
