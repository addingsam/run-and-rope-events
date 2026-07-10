"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { LocationSuggestion } from "@/types/event-search";

const inputClassName =
  "w-full rounded-xl border border-amber-200 bg-[#fffaf3] px-4 py-3 text-base text-amber-950 placeholder:text-amber-900/40 transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20";

interface LocationAutocompleteProps {
  label: string;
  inputId?: string;
  value: string;
  lat: number | null;
  lng: number | null;
  onChange: (value: {
    locationLabel: string;
    lat: number | null;
    lng: number | null;
  }) => void;
  error?: string;
}

export function LocationAutocomplete({
  label,
  inputId = "location",
  value,
  lat,
  lng,
  onChange,
  error,
}: LocationAutocompleteProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/geocode/suggest?q=${encodeURIComponent(query)}`);
        const data = (await response.json()) as { suggestions?: LocationSuggestion[] };
        setSuggestions(data.suggestions ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(suggestion: LocationSuggestion) {
    setQuery(suggestion.label);
    onChange({
      locationLabel: suggestion.label,
      lat: suggestion.lat,
      lng: suggestion.lng,
    });
    setOpen(false);
  }

  function handleInputChange(nextValue: string) {
    setQuery(nextValue);
    onChange({
      locationLabel: nextValue,
      lat: null,
      lng: null,
    });
  }

  const hasCoordinates = lat !== null && lng !== null;

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-amber-950">
        {label}
        <span className="ml-1 text-amber-700">*</span>
      </label>
      <input
        id={inputId}
        type="text"
        value={query}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) {
            setOpen(true);
          }
        }}
        placeholder="City, state or zip code"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        className={`${inputClassName} ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
      />
      {loading && (
        <p className="mt-2 text-xs text-amber-900/60">Looking up locations…</p>
      )}
      {!hasCoordinates && query.trim().length > 0 && !loading && (
        <p className="mt-2 text-xs text-amber-900/60">
          Select a suggestion to set the search center.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      {open && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-amber-200 bg-white py-2 shadow-lg"
        >
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} role="option">
              <button
                type="button"
                onClick={() => handleSelect(suggestion)}
                className="block w-full px-4 py-2 text-left text-sm text-amber-950 hover:bg-amber-50"
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
