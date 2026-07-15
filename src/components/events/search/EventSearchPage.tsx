"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
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
import { UpcomingEventsGrid } from "@/components/events/search/UpcomingEventsGrid";
import { getResultKey } from "@/lib/mapbox/search-map-utils";
import { parseSearchRodeoLevels } from "@/lib/events/rodeo-levels";
import {
  DEFAULT_SEARCH_BUFFER,
  DEFAULT_SEARCH_RADIUS,
  SEARCH_BUFFER_OPTIONS,
  SEARCH_FORMAT_OPTIONS,
  SEARCH_RADIUS_OPTIONS,
  SEARCH_RODEO_LEVEL_OPTIONS,
} from "@/lib/events/search-options";
import { filterDisciplinesForFormat, getDisciplineOptionsForFormat } from "@/lib/events/submission-options";
import {
  filterEventItemsByMapOverlay,
  filterResultsByMapOverlay,
  hasActiveMapOverlay,
} from "@/lib/events/filter-results-by-map-overlay";
import {
  filterEventsBySearchCriteria,
  filterResultsBySearchCriteria,
  hasActiveSearchCriteria,
  searchCriteriaFromFormState,
} from "@/lib/events/filter-results-by-search-criteria";
import type {
  EventSearchResponse,
  EventSearchResultItem,
  RouteSearchResponse,
  SearchBufferMiles,
  SearchFormat,
  SearchMode,
  SearchRadiusMiles,
  SearchResultEntry,
  SearchRodeoLevel,
} from "@/types/event-search";
import { SaveSearchDialog } from "@/components/saved/SaveSearchDialog";
import {
  themeInputClassName,
  themeLabelClassName,
  themeMutedTextClassName,
  themePanelClassName,
  themePrimaryButtonClassName,
  themeSecondaryButtonClassName,
} from "@/lib/theme/form-classes";
import {
  consumePendingSavedSearch,
  savedSearchParamsFromFormState,
  SEARCH_RUN_PARAM,
  upcomingFiltersFromQueryString,
  upcomingFiltersFromSavedParams,
} from "@/lib/saved-searches/run-saved-search";
import type { SavedMapOverlay } from "@/types/saved-search";
import type { SubmissionDiscipline } from "@/types/event-submission";

interface EventSearchPageProps {
  isSubscriber: boolean;
  mapboxToken: string;
  initialUpcomingEvents: EventSearchResultItem[];
  initialMapResults: SearchResultEntry[];
}

interface SearchFormState {
  mode: SearchMode;
  format: SearchFormat;
  rodeoLevels: SearchRodeoLevel[];
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

function createDefaultSearchFormState(): SearchFormState {
  return {
    mode: "map",
    format: "either",
    rodeoLevels: [],
    disciplines: [],
    locationLabel: "",
    lat: null,
    lng: null,
    radiusMiles: DEFAULT_SEARCH_RADIUS,
    originLabel: "",
    originLat: null,
    originLng: null,
    destinationLabel: "",
    destinationLat: null,
    destinationLng: null,
    bufferMiles: DEFAULT_SEARCH_BUFFER,
    startDate: "",
    endDate: "",
  };
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
  if (parsed === 5 || parsed === 10 || parsed === 25 || parsed === 50 || parsed === 100) {
    return parsed;
  }

  return DEFAULT_SEARCH_BUFFER;
}

function parseMode(value: string | null): SearchMode {
  if (value === "route") {
    return "route";
  }

  if (value === "radius") {
    return "radius";
  }

  return "map";
}

function buildSearchParams(state: SearchFormState) {
  const params = new URLSearchParams();

  if (state.mode === "map") {
    params.set("mode", "map");
  } else if (state.mode === "route") {
    params.set("mode", "route");
  }

  if (state.format !== "either") {
    params.set("format", state.format);
  }

  if (state.rodeoLevels.length > 0) {
    params.set("rodeoLevels", state.rodeoLevels.join(","));
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
  } else if (state.mode === "radius") {
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

function mapSearchUrl(pathname: string, state: SearchFormState) {
  const params = buildSearchParams(state);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function stateFromSearchParams(
  searchParams: URLSearchParams,
  options: { includeDates?: boolean } = {},
): SearchFormState {
  const includeDates = options.includeDates ?? false;

  return {
    mode: parseMode(searchParams.get("mode")),
    format: (searchParams.get("format") as SearchFormat | null) ?? "either",
    rodeoLevels: parseSearchRodeoLevels(
      searchParams.get("rodeoLevels") ?? searchParams.get("rodeoLevel"),
    ),
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
    startDate: includeDates ? (searchParams.get("startDate") ?? "") : "",
    endDate: includeDates ? (searchParams.get("endDate") ?? "") : "",
  };
}

function isRouteSearchResponse(
  response: EventSearchResponse,
): response is RouteSearchResponse {
  return "route" in response;
}

function canAutoSearch(state: SearchFormState) {
  if (state.mode === "map") {
    return false;
  }

  if (state.mode === "route") {
    return (
      Boolean(state.originLabel.trim() && state.destinationLabel.trim()) &&
      state.originLat !== null &&
      state.originLng !== null &&
      state.destinationLat !== null &&
      state.destinationLng !== null
    );
  }

  return (
    Boolean(state.locationLabel.trim()) &&
    state.lat !== null &&
    state.lng !== null
  );
}

function getSelectionKey(entry: SearchResultEntry) {
  return getResultKey(entry);
}

export function EventSearchPage({
  isSubscriber,
  mapboxToken,
  initialUpcomingEvents,
  initialMapResults,
}: EventSearchPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();

  const [formState, setFormState] = useState<SearchFormState>(createDefaultSearchFormState);
  const [results, setResults] = useState<EventSearchResponse | null>(null);
  const [routeMeta, setRouteMeta] = useState<RouteSearchResponse["route"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [originError, setOriginError] = useState<string | null>(null);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [defaultMapResults] = useState<SearchResultEntry[]>(initialMapResults);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [mapOverlay, setMapOverlay] = useState<SavedMapOverlay>({
    pinRadius: null,
    shapes: [],
  });
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveDialogSource, setSaveDialogSource] = useState<"map" | "search">("search");
  const resultRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const didInitializeFromUrl = useRef(false);

  const showRodeoLevelFilter =
    formState.format === "rodeo" || formState.format === "either";

  const showJackpotStructureFilter =
    formState.format === "jackpot" || formState.format === "either";

  const searchCriteria = useMemo(() => searchCriteriaFromFormState(formState), [formState]);
  const hasSearchCriteria = hasActiveSearchCriteria(searchCriteria);

  const mapResults = useMemo(() => {
    if (hasSearched) {
      return results?.results ?? [];
    }

    return filterResultsBySearchCriteria(defaultMapResults, searchCriteria);
  }, [hasSearched, results, defaultMapResults, searchCriteria]);
  const hasMapOverlayFilter = hasActiveMapOverlay(mapOverlay);

  const matchingEvents = useMemo(() => {
    const criteriaFiltered = filterEventsBySearchCriteria(initialUpcomingEvents, searchCriteria);
    return filterEventItemsByMapOverlay(criteriaFiltered, mapOverlay);
  }, [initialUpcomingEvents, searchCriteria, mapOverlay]);

  const overlayFilteredMapResults = useMemo(
    () => filterResultsByMapOverlay(mapResults, mapOverlay),
    [mapResults, mapOverlay],
  );

  const overlayFilteredSearchResults = useMemo(() => {
    if (!results) {
      return [];
    }

    return filterResultsByMapOverlay(results.results, mapOverlay);
  }, [results, mapOverlay]);

  const runSearch = useCallback(async (state: SearchFormState) => {
    if (state.mode === "route") {
      if (!state.originLabel.trim()) {
        setOriginError("Enter a starting point.");
        setResults(null);
        setRouteMeta(null);
        setSelectedKey(null);
        return;
      }

      if (state.originLat === null || state.originLng === null) {
        setOriginError("Select a starting point from the suggestions.");
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

      if (state.destinationLat === null || state.destinationLng === null) {
        setDestinationError("Select a destination from the suggestions.");
        setResults(null);
        setRouteMeta(null);
        setSelectedKey(null);
        return;
      }
    } else if (
      !state.locationLabel.trim() ||
      state.lat === null ||
      state.lng === null
    ) {
      setLocationError("Select a location from the suggestions.");
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
    if (didInitializeFromUrl.current) {
      if (searchParams.toString() === "") {
        setFormState(createDefaultSearchFormState());
        setResults(null);
        setRouteMeta(null);
        setHasSearched(false);
        setSelectedKey(null);
        setError(null);
        setLocationError(null);
        setOriginError(null);
        setDestinationError(null);
        setMapOverlay({ pinRadius: null, shapes: [] });
      }
      return;
    }

    didInitializeFromUrl.current = true;

    const pendingSavedSearch = consumePendingSavedSearch();
    if (pendingSavedSearch) {
      if (pendingSavedSearch.params.mode === "upcoming") {
        const upcoming = upcomingFiltersFromSavedParams(pendingSavedSearch.params);
        setFormState({
          ...createDefaultSearchFormState(),
          mode: "map",
          format:
            upcoming.formatFilter === "jackpot"
              ? "jackpot"
              : upcoming.formatFilter === "rodeo"
                ? "rodeo"
                : "either",
          rodeoLevels: upcoming.selectedRodeoLevels as SearchRodeoLevel[],
          disciplines: upcoming.selectedDisciplines,
        });
        if (pendingSavedSearch.mapOverlay) {
          setMapOverlay(pendingSavedSearch.mapOverlay);
        }
        router.replace(pathname, { scroll: false });
        return;
      }

      if (pendingSavedSearch.params.mode === "map") {
        const nextState: SearchFormState = {
          ...createDefaultSearchFormState(),
          mode: "map",
          format: pendingSavedSearch.params.format,
          rodeoLevels: pendingSavedSearch.params.rodeoLevels ?? [],
          disciplines: pendingSavedSearch.params.disciplines,
          startDate: pendingSavedSearch.params.startDate,
          endDate: pendingSavedSearch.params.endDate,
        };
        setFormState(nextState);
        if (pendingSavedSearch.mapOverlay) {
          setMapOverlay(pendingSavedSearch.mapOverlay);
        }
        router.replace(pathname, { scroll: false });
        return;
      }

      const nextState: SearchFormState = {
        ...createDefaultSearchFormState(),
        mode: pendingSavedSearch.params.mode === "route" ? "route" : "radius",
        format: pendingSavedSearch.params.format,
        rodeoLevels: pendingSavedSearch.params.rodeoLevels ?? [],
        disciplines: pendingSavedSearch.params.disciplines,
        locationLabel: pendingSavedSearch.params.locationLabel,
        lat: pendingSavedSearch.params.lat,
        lng: pendingSavedSearch.params.lng,
        radiusMiles: pendingSavedSearch.params.radiusMiles,
        originLabel: pendingSavedSearch.params.originLabel,
        originLat: pendingSavedSearch.params.originLat,
        originLng: pendingSavedSearch.params.originLng,
        destinationLabel: pendingSavedSearch.params.destinationLabel,
        destinationLat: pendingSavedSearch.params.destinationLat,
        destinationLng: pendingSavedSearch.params.destinationLng,
        bufferMiles: pendingSavedSearch.params.bufferMiles,
        startDate: pendingSavedSearch.params.startDate,
        endDate: pendingSavedSearch.params.endDate,
      };
      setFormState(nextState);
      if (pendingSavedSearch.mapOverlay) {
        setMapOverlay(pendingSavedSearch.mapOverlay);
      }
      void runSearch(nextState);
      const params = buildSearchParams(nextState);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      return;
    }

    const upcomingFromUrl = upcomingFiltersFromQueryString(searchParams);
    if (upcomingFromUrl) {
      setFormState({
        ...createDefaultSearchFormState(),
        mode: "map",
        format:
          upcomingFromUrl.formatFilter === "jackpot"
            ? "jackpot"
            : upcomingFromUrl.formatFilter === "rodeo"
              ? "rodeo"
              : "either",
        rodeoLevels: upcomingFromUrl.selectedRodeoLevels as SearchRodeoLevel[],
        disciplines: upcomingFromUrl.selectedDisciplines,
      });
      router.replace(pathname, { scroll: false });
      return;
    }

    const isExplicitSearchRun = searchParams.get(SEARCH_RUN_PARAM) === "1";
    const urlState = stateFromSearchParams(searchParams, { includeDates: false });
    if (urlState.mode === "map") {
      setFormState(urlState);
      router.replace(mapSearchUrl(pathname, urlState), { scroll: false });
      return;
    }

    const urlStateForSearch = stateFromSearchParams(searchParams, {
      includeDates: isExplicitSearchRun,
    });
    if (isExplicitSearchRun && canAutoSearch(urlStateForSearch)) {
      setFormState(urlStateForSearch);
      void runSearch(urlStateForSearch);
      router.replace(mapSearchUrl(pathname, urlStateForSearch), { scroll: false });
      return;
    }

    if (searchParams.toString()) {
      setFormState(urlStateForSearch);
      router.replace(pathname, { scroll: false });
    }
  }, [pathname, router, runSearch, searchParams]);

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
        next.rodeoLevels = [];
        next.disciplines = filterDisciplinesForFormat(next.disciplines, "jackpot");
      }

      if (patch.format === "rodeo") {
        next.disciplines = filterDisciplinesForFormat(next.disciplines, "rodeo");
      }

      return next;
    });
  }

  function updateSearchDate(field: "startDate" | "endDate", value: string) {
    setFormState((current) => {
      const next = { ...current, [field]: value };
      router.replace(mapSearchUrl(pathname, next), { scroll: false });
      return next;
    });
  }

  function clearSearchDate(field: "startDate" | "endDate") {
    updateSearchDate(field, "");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (formState.mode === "map") {
      const params = buildSearchParams(formState);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      return;
    }

    if (formState.mode === "route") {
      if (!formState.originLabel.trim()) {
        setOriginError("Enter a starting point.");
        return;
      }

      if (formState.originLat === null || formState.originLng === null) {
        setOriginError("Select a starting point from the suggestions.");
        return;
      }

      if (!formState.destinationLabel.trim()) {
        setDestinationError("Enter a destination.");
        return;
      }

      if (formState.destinationLat === null || formState.destinationLng === null) {
        setDestinationError("Select a destination from the suggestions.");
        return;
      }
    } else if (
      !formState.locationLabel.trim() ||
      formState.lat === null ||
      formState.lng === null
    ) {
      setLocationError("Select a location from the suggestions.");
      return;
    }

    const params = buildSearchParams(formState);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    void runSearch(formState);
  }

  function renderResultCard(entry: SearchResultEntry) {
    const key = getSelectionKey(entry);

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

  const saveSearchButtonClassName = themeSecondaryButtonClassName;

  const searchCenter =
    formState.mode === "radius" && formState.lat !== null && formState.lng !== null
      ? { lat: formState.lat, lng: formState.lng }
      : null;

  const canUseSaveSearch = authLoaded && isSignedIn && isSubscriber;

  const canSaveMapActivity =
    canUseSaveSearch &&
    formState.mode === "map" &&
    (hasMapOverlayFilter || hasSearchCriteria);

  const canSaveSearchActivity =
    canUseSaveSearch &&
    (formState.mode === "map"
      ? hasMapOverlayFilter || hasSearchCriteria
      : canAutoSearch(formState));

  function getSaveParamsForSource(source: "map" | "search") {
    return savedSearchParamsFromFormState({
      ...formState,
      mode: formState.mode === "map" || source === "map" ? "map" : formState.mode,
    });
  }

  function openSaveDialog(source: "map" | "search") {
    setSaveDialogSource(source);
    setSaveDialogOpen(true);
  }

  const handleMapOverlayChange = useCallback((overlay: SavedMapOverlay) => {
    setMapOverlay(overlay);
  }, []);

  function handleResultCardClick(
    event: React.MouseEvent<HTMLDivElement>,
    key: string,
  ) {
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, label")) {
      return;
    }

    setSelectedKey(key);
  }

  const matchingEventsCountLabel =
    matchingEvents.length === 0
      ? hasMapOverlayFilter || hasSearchCriteria
        ? "No events match your current criteria and map area."
        : "Showing all upcoming events."
      : `${matchingEvents.length} event${matchingEvents.length === 1 ? "" : "s"} match your search criteria${
          hasMapOverlayFilter ? " inside the drawn map area" : ""
        }.`;

  const mapSummary =
    formState.mode === "map"
      ? hasMapOverlayFilter
        ? `Showing ${overlayFilteredMapResults.length} event${
            overlayFilteredMapResults.length === 1 ? "" : "s"
          } inside your drawn area (${mapResults.length} match your criteria on the map).`
        : `Showing ${overlayFilteredMapResults.length} event${
            overlayFilteredMapResults.length === 1 ? "" : "s"
          } that match your criteria. Draw a box, freehand area, or pin + radius to narrow by location.`
      : !hasSearched
        ? hasMapOverlayFilter
          ? `Showing ${overlayFilteredMapResults.length} event${
              overlayFilteredMapResults.length === 1 ? "" : "s"
            } inside your drawn area (${mapResults.length} total on map).`
          : `Showing ${overlayFilteredMapResults.length} geocoded upcoming event${
              overlayFilteredMapResults.length === 1 ? "" : "s"
            } on the map.`
        : hasMapOverlayFilter
          ? `Showing ${overlayFilteredMapResults.length} event${
              overlayFilteredMapResults.length === 1 ? "" : "s"
            } inside your drawn area (${mapResults.length} search results on map).`
          : "Search results shown on the map below.";

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Search events</h2>
            <p className={`mt-1 ${themeMutedTextClassName}`}>
              Set your criteria, draw on the map, or search by radius or route. Filters update the
              map and results together.
            </p>
          </div>
          {canSaveSearchActivity ? (
            <button
              type="button"
              onClick={() => openSaveDialog("search")}
              className={saveSearchButtonClassName}
            >
              Save &amp; get alerts
            </button>
          ) : canUseSaveSearch ? (
            <p className={themeMutedTextClassName}>
              {formState.mode === "map"
                ? "Set criteria or draw on the map to save this search."
                : "Select a location from the suggestions to save this search."}
            </p>
          ) : authLoaded && isSignedIn && !isSubscriber ? (
            <p className={themeMutedTextClassName}>
              An active subscription is required to save searches.
            </p>
          ) : null}
        </div>

        <SearchModeToggle
          mode={formState.mode}
          onChange={(mode) => {
            if (mode === formState.mode) {
              return;
            }

            setResults(null);
            setRouteMeta(null);
            setHasSearched(false);
            setSelectedKey(null);
            setError(null);
            updateFormState({ mode });
          }}
        />

        <form
          onSubmit={handleSubmit}
          className={`p-5 shadow-sm sm:p-6 ${themePanelClassName}`}
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

            {showRodeoLevelFilter && (
              <div className="lg:col-span-2">
                <CheckboxGroup
                  label="Rodeo level"
                  hint="Leave unchecked to include all rodeo levels. Select multiple to see events matching any chosen level."
                  options={SEARCH_RODEO_LEVEL_OPTIONS}
                  values={formState.rodeoLevels}
                  onChange={(levels) =>
                    updateFormState({ rodeoLevels: levels as SearchRodeoLevel[] })
                  }
                  id="rodeoLevels"
                />
              </div>
            )}

            {showJackpotStructureFilter && (
              <div className="lg:col-span-2">
                <CheckboxGroup
                  label="Jackpot structure"
                  hint="Leave unchecked to include all jackpot structures."
                  options={getDisciplineOptionsForFormat("jackpot")}
                  values={formState.disciplines}
                  onChange={(disciplines) =>
                    updateFormState({ disciplines: disciplines as SubmissionDiscipline[] })
                  }
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
              <div>
                <label htmlFor="searchStartDate" className={themeLabelClassName}>
                  Start date
                </label>
                <p className={`mb-2 ${themeMutedTextClassName}`}>
                  Optional — leave blank to include all dates.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    id="searchStartDate"
                    name="searchStartDate"
                    type="date"
                    autoComplete="off"
                    value={formState.startDate}
                    onChange={(event) => updateSearchDate("startDate", event.target.value)}
                    className={`${themeInputClassName} min-w-0 flex-1`}
                  />
                  {formState.startDate ? (
                    <button
                      type="button"
                      onClick={() => clearSearchDate("startDate")}
                      className={themeSecondaryButtonClassName}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
              <div>
                <label htmlFor="searchEndDate" className={themeLabelClassName}>
                  End date
                </label>
                <p className={`mb-2 ${themeMutedTextClassName}`}>
                  Optional — leave blank to include all dates.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    id="searchEndDate"
                    name="searchEndDate"
                    type="date"
                    autoComplete="off"
                    value={formState.endDate}
                    onChange={(event) => updateSearchDate("endDate", event.target.value)}
                    className={`${themeInputClassName} min-w-0 flex-1`}
                  />
                  {formState.endDate ? (
                    <button
                      type="button"
                      onClick={() => clearSearchDate("endDate")}
                      className={themeSecondaryButtonClassName}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {formState.mode === "map" && (
              <div className="lg:col-span-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
                Use the map below to draw a box, freehand area, or pin + radius. Results update as
                you change criteria and your drawing.
              </div>
            )}

            {formState.mode === "radius" && (
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
            )}

            {formState.mode === "route" && (
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
          </div>

          {formState.mode !== "map" && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="submit"
                className={`px-5 py-2.5 ${themePrimaryButtonClassName}`}
              >
                {formState.mode === "route" ? "Search along route" : "Search events"}
              </button>
              {!isSubscriber && (
                <p className={themeMutedTextClassName}>
                  Pro rodeo listings are free to browse. Full event details require a subscription.
                </p>
              )}
            </div>
          )}
        </form>
      </section>

      {mapboxToken && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Event map</h2>
              <p className={`mt-1 ${themeMutedTextClassName}`}>{mapSummary}</p>
            </div>
            {canSaveMapActivity ? (
              <button
                type="button"
                onClick={() => openSaveDialog("map")}
                className={saveSearchButtonClassName}
              >
                Save &amp; get alerts
              </button>
            ) : null}
          </div>

          <EventsSearchMap
            mapboxToken={mapboxToken}
            results={overlayFilteredMapResults}
            isSubscriber={isSubscriber}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            viewMode={hasSearched ? "search" : "default"}
            routeMeta={hasSearched ? routeMeta : null}
            searchCenter={hasSearched ? searchCenter : null}
            initialMapOverlay={
              mapOverlay.pinRadius || mapOverlay.shapes.length > 0 ? mapOverlay : null
            }
            origin={
              hasSearched &&
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
              hasSearched &&
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
        </section>
      )}

      {!hasSearched && (
        <UpcomingEventsGrid
          events={matchingEvents}
          countLabel={matchingEventsCountLabel}
          emptyTitle={
            hasMapOverlayFilter ? "No events in drawn area" : "No events match your filters"
          }
          emptyMessage={
            hasMapOverlayFilter
              ? "None of the listings match your criteria inside the map drawing. Adjust your filters or clear the drawing."
              : "Try adjusting your format, discipline, date, or rodeo level selections."
          }
          isSubscriber={isSubscriber}
          selectedKey={selectedKey}
          onSelectCard={setSelectedKey}
          onCardRef={(key, element) => {
            resultRefs.current[key] = element;
          }}
        />
      )}

      <section aria-live="polite" className="space-y-4">
        {hasSearched && (
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Search results</h2>
          </div>
        )}

        {loading && (
          <p className={themeMutedTextClassName}>
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

        {!loading && hasSearched && !error && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {results ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {hasMapOverlayFilter
                    ? `${overlayFilteredSearchResults.length} result${
                        overlayFilteredSearchResults.length === 1 ? "" : "s"
                      } in drawn area`
                    : `${results.counts.total} result${results.counts.total === 1 ? "" : "s"}`}
                  {hasMapOverlayFilter && (
                    <span className="font-normal text-[var(--color-text-muted)]">
                      {" "}
                      ({results.counts.total} total from search)
                    </span>
                  )}
                  {!hasMapOverlayFilter && results.counts.proRodeos > 0 && (
                    <span className="font-normal text-[var(--color-text-muted)]">
                      {" "}
                      ({results.counts.events} listing
                      {results.counts.events === 1 ? "" : "s"}, {results.counts.proRodeos} pro rodeo
                      {results.counts.proRodeos === 1 ? "" : "s"})
                    </span>
                  )}
                </p>
                {routeMeta && (
                  <p className={themeMutedTextClassName}>
                    Driving route: {routeMeta.distanceMiles.toFixed(1)} miles ·{" "}
                    {Math.round(routeMeta.durationMinutes)} min
                  </p>
                )}
              </div>
            ) : (
              <div />
            )}

            {canSaveSearchActivity ? (
              <button
                type="button"
                onClick={() => openSaveDialog("search")}
                className={saveSearchButtonClassName}
              >
                Save &amp; get alerts
              </button>
            ) : null}
          </div>
        )}

        {!loading && hasSearched && results?.counts.total === 0 && (
          <div className={`px-5 py-10 text-center ${themePanelClassName}`}>
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">No events found</p>
            <p className={`mt-2 ${themeMutedTextClassName}`}>
              {formState.mode === "route"
                ? "Try widening the buffer distance, adjusting dates, or changing your filters."
                : "Try widening the radius, adjusting dates, or changing your filters."}
            </p>
          </div>
        )}

        {!loading &&
          hasSearched &&
          results &&
          results.counts.total > 0 &&
          overlayFilteredSearchResults.length === 0 &&
          hasMapOverlayFilter && (
            <div className={`px-5 py-10 text-center ${themePanelClassName}`}>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">No events in drawn area</p>
              <p className={`mt-2 ${themeMutedTextClassName}`}>
                Your search returned results, but none fall inside the map drawing. Adjust or clear
                your drawing to see more.
              </p>
            </div>
          )}

        {hasSearched && !loading && overlayFilteredSearchResults.length > 0 && (
          <div
            className={
              formState.mode === "radius"
                ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-4"
            }
          >
            {overlayFilteredSearchResults.map((entry) => {
              const key = getSelectionKey(entry);
              const isSelected = selectedKey === key;

              return (
                <div
                  key={key}
                  ref={(element) => {
                    resultRefs.current[key] = element;
                  }}
                  onClick={(clickEvent) => handleResultCardClick(clickEvent, key)}
                  className={`rounded-2xl transition-shadow ${
                    isSelected ? "ring-2 ring-[var(--color-accent-primary)] ring-offset-2 ring-offset-[var(--color-background)]" : ""
                  }`}
                >
                  {renderResultCard(entry)}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <SaveSearchDialog
        open={saveDialogOpen}
        searchParams={getSaveParamsForSource(saveDialogSource)}
        mapOverlay={
          mapOverlay.pinRadius || mapOverlay.shapes.length > 0 ? mapOverlay : null
        }
        onClose={() => setSaveDialogOpen(false)}
      />
    </div>
  );
}
