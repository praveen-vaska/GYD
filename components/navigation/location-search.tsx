"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, LocateFixed, MapPin, Search } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useGydStore } from "@/features/store/gyd-store";
import { PlaceSuggestion, searchPlacesLocal } from "@/lib/location/nearby";
import { cn } from "@/lib/utils";

interface LocationSearchProps {
  compact?: boolean;
  valueLabel?: string;
  onSelectPlace?: (place: PlaceSuggestion) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Google-Places-ready location autocomplete & GPS selector.
 * Calls `/api/places/search?q=...` (which integrates Google Places API when
 * `GOOGLE_MAPS_API_KEY` is configured and uses the Indian cities/towns/villages
 * directory in mock mode).
 */
export function LocationPicker({
  compact = true,
  valueLabel,
  onSelectPlace,
  className,
  placeholder = "Search city, town, area, or village...",
}: LocationSearchProps) {
  const { pushToast } = useToast();
  const {
    state,
    locationStatus,
    detectCurrentLocation,
    setSelectedPlace,
  } = useGydStore();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSuggestion[]>(() =>
    searchPlacesLocal("")
  );
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const displayLabel =
    valueLabel ??
    state.userLocation?.label ??
    (state.selectedCity !== "All Cities" ? state.selectedCity : "Select Location");

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/places/search?q=${encodeURIComponent(query)}&city=${encodeURIComponent(
            state.selectedCity !== "All Cities" ? state.selectedCity : "Hyderabad"
          )}`
        );
        if (res.ok) {
          const data = (await res.json()) as { places?: PlaceSuggestion[] };
          if (Array.isArray(data.places)) {
            setResults(data.places);
          }
        } else {
          setResults(searchPlacesLocal(query));
        }
      } catch {
        setResults(searchPlacesLocal(query));
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => window.clearTimeout(handle);
  }, [query, open, state.selectedCity]);

  const handleChoosePlace = (place: PlaceSuggestion) => {
    if (onSelectPlace) {
      onSelectPlace(place);
    } else {
      setSelectedPlace(place);
      pushToast({
        title: `Location set to ${place.label}`,
        description:
          place.kind === "village" || place.kind === "custom"
            ? `Fetching designers in ${place.label} and nearest surrounding hubs.`
            : `Showing nearby designers around ${place.label}.`,
        type: "success",
      });
    }
    setQuery("");
    setOpen(false);
  };

  const handleDetectGps = async () => {
    const res = await detectCurrentLocation();
    if (res.ok && res.data) {
      if (onSelectPlace) {
        onSelectPlace({
          id: "gps-current",
          label: res.data.label ?? res.data.city,
          secondaryText: "Current GPS Coordinates",
          city: res.data.city,
          state: "India",
          kind: "city",
          lat: res.data.lat,
          lng: res.data.lng,
          source: "MOCK_DIRECTORY",
        });
      }
      pushToast({
        title: `Current location: ${res.data.city}`,
        description: "Updated nearby designers sorted by distance.",
        type: "success",
      });
      setOpen(false);
    } else if (res.error) {
      pushToast({
        title: "Unable to detect GPS location",
        description: res.error,
        type: "warning",
      });
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Choose or search location"
        className={cn(
          "flex items-center justify-between gap-2 rounded-xl border border-brand-border bg-brand-surface text-brand-text hover:bg-brand-surface-muted transition-colors cursor-pointer",
          compact
            ? "px-2 xl:px-2.5 py-1.5 text-xs font-semibold max-w-[124px] xl:max-w-[185px]"
            : "w-full h-10.5 px-3.5 py-2 text-sm font-medium bg-brand-bg"
        )}
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <MapPin className="h-3.5 w-3.5 text-brand-accent shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-brand-muted shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-[min(340px,90vw)] rounded-2xl border border-brand-border bg-brand-surface p-3 shadow-2xl z-50 space-y-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-brand-border-strong bg-brand-bg px-3 py-2">
            <Search className="h-4 w-4 text-brand-muted-fg shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) {
                  e.preventDefault();
                  handleChoosePlace(results[0]);
                }
              }}
              placeholder={placeholder}
              aria-label="Search city, town, or village"
              className="w-full bg-transparent text-sm text-brand-text placeholder:text-brand-muted focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleDetectGps}
            disabled={locationStatus === "detecting"}
            className="flex w-full items-center gap-2.5 rounded-xl bg-brand-secondary/70 px-3 py-2 text-left text-xs font-bold text-brand-primary hover:bg-brand-secondary transition-colors cursor-pointer"
          >
            <LocateFixed
              className={cn(
                "h-4 w-4 text-brand-accent shrink-0",
                locationStatus === "detecting" && "animate-spin"
              )}
            />
            <span>
              {locationStatus === "detecting"
                ? "Detecting current GPS location..."
                : "Use Current GPS Location"}
            </span>
          </button>

          <div className="max-h-60 overflow-y-auto divide-y divide-brand-border/60">
            {loading && results.length === 0 ? (
              <p className="py-4 text-center text-xs text-brand-muted-fg">
                Searching places...
              </p>
            ) : (
              results.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => handleChoosePlace(place)}
                  className="flex w-full items-start gap-2.5 px-2 py-2.5 text-left hover:bg-brand-surface-muted rounded-xl transition-colors cursor-pointer"
                >
                  <MapPin className="h-3.5 w-3.5 text-brand-accent shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-brand-text truncate">
                        {place.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-muted-fg shrink-0">
                        {place.kind}
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-text-secondary truncate">
                      {place.secondaryText}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
