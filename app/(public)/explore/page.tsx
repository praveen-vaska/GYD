"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Filter,
  LayoutGrid,
  List,
  LocateFixed,
  Navigation,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { DesignerCard } from "@/components/designers/designer-card";
import { LocationPicker } from "@/components/navigation/location-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useGydStore } from "@/features/store/gyd-store";

type SortMode =
  | "relevance"
  | "nearest"
  | "rating"
  | "price_asc"
  | "price_desc"
  | "popularity";

function ExploreContent() {
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const {
    state,
    locationStatus,
    getVisibleDesigners,
    detectCurrentLocation,
    setSelectedCity,
    setSelectedPlace,
    getDesignerDistanceKm,
  } = useGydStore();

  const initialCategory = searchParams.get("category") ?? "All Categories";
  const initialQuery = searchParams.get("q") ?? "";
  const initialSort =
    (searchParams.get("sort") as SortMode) ||
    (state.userLocation ? "nearest" : "relevance");

  const [query, setQuery] = useState(initialQuery);
  const [cityOverride, setCityOverride] = useState<string | null>(
    searchParams.get("city")
  );
  const city = cityOverride ?? state.selectedCity;
  const setCity = (nextCity: string) => setCityOverride(nextCity);
  const [category, setCategory] = useState(initialCategory);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(0);
  const [minRating, setMinRating] = useState<number>(0);
  const [minExperience, setMinExperience] = useState<number>(0);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortMode>(initialSort);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9);

  const visibleDesigners = getVisibleDesigners();
  const activeCategories = state.categories.filter((c) => c.isActive);

  const handleUseLocation = async () => {
    const res = await detectCurrentLocation();
    if (res.ok && res.data) {
      setCity(res.data.city);
      setSortBy("nearest");
      pushToast({
        title: `Location detected near ${res.data.city}`,
        description: "Sorted designers closest to your current coordinates.",
        type: "success",
      });
    } else if (res.error) {
      pushToast({
        title: "Unable to read location",
        description: res.error,
        type: "warning",
      });
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleDesigners
      .map((d) => ({
        designer: d,
        distanceKm: getDesignerDistanceKm(d),
      }))
      .filter(({ designer: d, distanceKm }) => {
        if (city !== "All Cities" && d.city !== city && maxDistanceKm === 0) {
          const allowNearbyNeighbor =
            sortBy === "nearest" &&
            typeof distanceKm === "number" &&
            distanceKm <= 100;
          if (!allowNearbyNeighbor) return false;
        }
        if (maxDistanceKm > 0 && typeof distanceKm === "number") {
          if (distanceKm > maxDistanceKm) return false;
        }
        if (category !== "All Categories") {
          const matchesCat =
            d.categoryNames.some((n) => n.toLowerCase() === category.toLowerCase()) ||
            state.services.some(
              (s) =>
                s.designerId === d.id &&
                s.subcategoryName.toLowerCase() === category.toLowerCase()
            );
          if (!matchesCat) return false;
        }
        if (d.startingPriceInr > maxPrice) return false;
        if (d.rating < minRating) return false;
        if (d.experienceYears < minExperience) return false;
        if (
          availableOnly &&
          !d.availabilitySummary.toLowerCase().includes("today") &&
          !d.availabilitySummary.toLowerCase().includes("tomorrow")
        ) {
          return false;
        }
        if (q) {
          const servicesForDesigner = state.services
            .filter((s) => s.designerId === d.id)
            .map((s) => `${s.title} ${s.subcategoryName}`)
            .join(" ");
          const hay = `${d.name} ${d.title} ${d.city} ${d.skills.join(" ")} ${d.categoryNames.join(" ")} ${servicesForDesigner}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "nearest":
            if (
              typeof a.distanceKm === "number" &&
              typeof b.distanceKm === "number"
            ) {
              return a.distanceKm - b.distanceKm;
            }
            return b.designer.rating - a.designer.rating;
          case "rating":
            return (
              b.designer.rating - a.designer.rating ||
              b.designer.reviewCount - a.designer.reviewCount
            );
          case "price_asc":
            return a.designer.startingPriceInr - b.designer.startingPriceInr;
          case "price_desc":
            return b.designer.startingPriceInr - a.designer.startingPriceInr;
          case "popularity":
            return b.designer.reviewCount - a.designer.reviewCount;
          default:
            return (
              Number(b.designer.isFeatured) - Number(a.designer.isFeatured) ||
              b.designer.rating - a.designer.rating
            );
        }
      });
  }, [
    visibleDesigners,
    city,
    category,
    maxPrice,
    maxDistanceKm,
    minRating,
    minExperience,
    availableOnly,
    query,
    sortBy,
    state.services,
    getDesignerDistanceKm,
  ]);

  const resetFilters = () => {
    setQuery("");
    setCity("All Cities");
    setSelectedCity("All Cities");
    setCategory("All Categories");
    setMaxPrice(10000);
    setMaxDistanceKm(0);
    setMinRating(0);
    setMinExperience(0);
    setAvailableOnly(false);
    setSortBy("relevance");
  };

  const FilterControls = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-editorial text-lg font-semibold text-brand-text flex items-center gap-2">
          <Filter className="h-4 w-4 text-brand-accent" />
          Refine Designers
        </h2>
        <button
          type="button"
          onClick={resetFilters}
          className="text-xs font-semibold text-brand-accent hover:underline cursor-pointer"
        >
          Reset all
        </button>
      </div>

      <Button
        type="button"
        variant="accent"
        size="sm"
        onClick={handleUseLocation}
        disabled={locationStatus === "detecting"}
        className="w-full"
      >
        <LocateFixed
          className={`h-4 w-4 ${locationStatus === "detecting" ? "animate-spin" : ""
            }`}
        />
        {locationStatus === "detecting"
          ? "Detecting GPS..."
          : state.userLocation?.source === "GPS" ||
            state.userLocation?.source === "AUTO"
            ? `Near ${state.userLocation.city} (Refresh)`
            : "Find Nearby (Current Location)"}
      </Button>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
            Location / Village / City
          </label>
          {city !== "All Cities" && (
            <button
              type="button"
              onClick={() => {
                setCity("All Cities");
                setSelectedCity("All Cities");
              }}
              className="text-[11px] font-semibold text-brand-accent hover:underline cursor-pointer"
            >
              Show All India
            </button>
          )}
        </div>
        <LocationPicker
          compact={false}
          valueLabel={
            state.userLocation?.label ??
            (city !== "All Cities" ? city : "All Cities")
          }
          onSelectPlace={(place) => {
            setSelectedPlace(place);
            setCity(place.city);
            setSortBy("nearest");
          }}
          placeholder="Search city, town, or village..."
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="filter-distance" className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
          Max Distance
        </label>
        <Select
          id="filter-distance"
          value={String(maxDistanceKm)}
          onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
        >
          <option value="0">Any distance</option>
          <option value="15">Within 15 km</option>
          <option value="30">Within 30 km</option>
          <option value="50">Within 50 km</option>
          <option value="100">Within 100 km</option>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="filter-cat" className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
          Category
        </label>
        <Select
          id="filter-cat"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="All Categories">All Categories</option>
          {activeCategories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-brand-muted-fg">
            Max Starting Price
          </span>
          <span className="font-bold text-brand-primary">
            ₹{maxPrice.toLocaleString("en-IN")}
          </span>
        </div>
        <input
          type="range"
          min={499}
          max={10000}
          step={500}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          aria-label="Maximum starting price"
          className="w-full accent-[var(--color-primary)] cursor-pointer"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="filter-rating" className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
          Minimum Rating
        </label>
        <Select
          id="filter-rating"
          value={String(minRating)}
          onChange={(e) => setMinRating(Number(e.target.value))}
        >
          <option value="0">Any rating</option>
          <option value="4.5">4.5 ★ & above</option>
          <option value="4.8">4.8 ★ & above</option>
          <option value="4.9">4.9 ★ & above</option>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="filter-exp" className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
          Experience
        </label>
        <Select
          id="filter-exp"
          value={String(minExperience)}
          onChange={(e) => setMinExperience(Number(e.target.value))}
        >
          <option value="0">Any experience</option>
          <option value="5">5+ years</option>
          <option value="8">8+ years</option>
          <option value="10">10+ years</option>
        </Select>
      </div>

      <label className="flex items-center gap-2.5 rounded-xl border border-brand-border bg-brand-bg p-3 text-sm font-medium text-brand-text cursor-pointer">
        <input
          type="checkbox"
          checked={availableOnly}
          onChange={(e) => setAvailableOnly(e.target.checked)}
          className="h-4 w-4 accent-[var(--color-primary)] rounded"
        />
        Available Today / Tomorrow
      </label>
    </div>
  );

  return (
    <div className="gyd-container py-10">
      {/* Header */}
      <div className="mb-8 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">Curated Marketplace</Badge>
          {state.userLocation && (
            <Badge tone="info">
              <Navigation className="h-3 w-3" />
              Location: {state.userLocation.label ?? state.userLocation.city} (
              {state.userLocation.source})
            </Badge>
          )}
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-brand-text">
              Explore Verified Designers
            </h1>
            <p className="mt-1 text-sm text-brand-text-secondary">
              Search stylists, bridal makeup artists, groom couturiers, decorators,
              and interior consultants nearby or across India.
            </p>
          </div>
          <p className="text-sm font-semibold text-brand-primary">
            Showing {Math.min(visibleCount, filtered.length)} of {filtered.length}{" "}
            verified professionals
          </p>
        </div>
      </div>

      {/* Top Search & Sort Toolbar */}
      <div className="gyd-card p-3.5 mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted-fg" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by designer name, neighborhood, skill, or service..."
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleUseLocation}
            disabled={locationStatus === "detecting"}
          >
            <LocateFixed
              className={`h-4 w-4 text-brand-accent ${locationStatus === "detecting" ? "animate-spin" : ""
                }`}
            />
            <span className="hidden sm:inline">Near Me</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>

          <Select
            aria-label="Sort designers"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortMode)}
            className="w-44"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="nearest">Sort: Nearest to Me</option>
            <option value="rating">Sort: Highest Rated</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="popularity">Sort: Popularity</option>
          </Select>

          <div className="hidden sm:flex items-center rounded-xl border border-brand-border bg-brand-bg p-1">
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-1.5 cursor-pointer ${viewMode === "grid"
                ? "bg-brand-primary text-brand-primary-fg"
                : "text-brand-muted-fg hover:text-brand-text"
                }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="List view"
              onClick={() => setViewMode("list")}
              className={`rounded-lg p-1.5 cursor-pointer ${viewMode === "list"
                ? "bg-brand-primary text-brand-primary-fg"
                : "text-brand-muted-fg hover:text-brand-text"
                }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid with Desktop Filter Sidebar */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        <aside className="hidden lg:block lg:col-span-3 gyd-card p-5 sticky top-24">
          {FilterControls}
        </aside>

        <div className="lg:col-span-9 space-y-6">
          {filtered.length === 0 ? (
            <EmptyState
              title="No designers match those exact filters"
              description="Try expanding your distance radius, choosing All Cities, or resetting category filters."
              actionLabel="Reset All Filters"
              onAction={resetFilters}
            />
          ) : (
            <>
              <div
                className={
                  viewMode === "list"
                    ? "grid gap-5 grid-cols-1"
                    : "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                }
              >
                {filtered.slice(0, visibleCount).map((entry, idx) => (
                  <DesignerCard
                    key={entry.designer.id}
                    designer={entry.designer}
                    distanceKm={entry.distanceKm}
                    layout={viewMode}
                    index={idx}
                  />
                ))}
              </div>

              {visibleCount < filtered.length && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setVisibleCount((n) => n + 6)}
                  >
                    Load More Designers ({filtered.length - visibleCount} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            onClick={() => setMobileFiltersOpen(false)}
            className="fixed inset-0 bg-black/50"
          />
          <div className="relative z-10 w-80 max-w-[90vw] bg-brand-surface h-full overflow-y-auto p-5 shadow-2xl border-l border-brand-border">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filter drawer"
                className="rounded-xl p-1.5 text-brand-muted hover:bg-brand-surface-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {FilterControls}
            <Button
              variant="primary"
              className="w-full mt-6"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Show {filtered.length} Results
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="gyd-container py-12 grid gap-6 sm:grid-cols-3">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
