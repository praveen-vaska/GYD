"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Compass,
  LocateFixed,
  Navigation,
  Search,
  Star,
  Tag,
  UserCheck,
  Wand2,
} from "lucide-react";
import { DesignerCard } from "@/components/designers/designer-card";
import { LocationPicker } from "@/components/navigation/location-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  GYD_BRAND,
  OCCASION_INSPIRATION_COLLECTIONS,
  OCCASION_OPTIONS,
} from "@/constants/gyd";
import { useGydStore } from "@/features/store/gyd-store";
import { PlaceSuggestion } from "@/lib/location/nearby";

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Choose Your Service",
    description:
      "Select from Wedding Styling, Bridal Makeup, Groom Couture, Event Scenography, Interior Styling, or Gift Curation.",
    icon: Compass,
  },
  {
    step: "02",
    title: "Discover Designers",
    description:
      "Compare verified portfolios, transparent INR pricing, city availability, and client reviews tailored to your budget.",
    icon: Search,
  },
  {
    step: "03",
    title: "Book Your Appointment",
    description:
      "Pick Home Visit, Studio, Online Consultation, Shopping Assistance, or Venue Visit in a conflict-free time slot.",
    icon: CalendarCheck,
  },
  {
    step: "04",
    title: "Get Your Perfect Look",
    description:
      "Collaborate directly in your GYD messaging studio and bring a cohesive, confident vision to life.",
    icon: Wand2,
  },
];

const HERO_CAROUSEL_SLIDES = [
  {
    id: "slide-wedding",
    imageUrl: "/images/hero/editorial-hero.jpg",
    imageAlt: "Indian bridal couture styling consultation in studio",
    badge: "Curated Bridal Lookbook",
    designerId: "des-1",
    designerTitle: "Meera Vardhan · Wedding Stylist",
    meta: "Hyderabad · Starting ₹4,999 · 4.9 ★ (128)",
  },
  {
    id: "slide-groom",
    imageUrl: "/images/designers/designer-02.jpg",
    imageAlt: "Bespoke groom and menswear styling in plum tailored jacket",
    badge: "Bespoke Groom Couture",
    designerId: "des-2",
    designerTitle: "Arjun Kapoor · Groom Director",
    meta: "Mumbai · Starting ₹2,999 · 4.9 ★ (94)",
  },
  {
    id: "slide-interior",
    imageUrl: "/images/categories/interior-design.jpg",
    imageAlt: "Modern luxury living room interior styling",
    badge: "Interior & Living Spaces",
    designerId: "des-5",
    designerTitle: "Kabir Bhatia · Interior Stylist",
    meta: "Bengaluru · Starting ₹1,499 · 4.8 ★ (73)",
  },
];

export default function HomePage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { pushToast } = useToast();
  const {
    state,
    locationStatus,
    getVisibleDesigners,
    setSelectedPlace,
    detectCurrentLocation,
    getDesignerDistanceKm,
    loginDemoRole,
  } = useGydStore();

  const [searchService, setSearchService] = useState("");
  const [heroPlace, setHeroPlace] = useState<PlaceSuggestion | null>(null);
  const [heroOccasion, setHeroOccasion] = useState("Wedding");
  const [slideIdx, setSlideIdx] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

  const visibleDesigners = getVisibleDesigners();
  const visibleDesignerIds = new Set(visibleDesigners.map((d) => d.id));
  const activeHeroSlides = HERO_CAROUSEL_SLIDES.filter((s) =>
    visibleDesignerIds.has(s.designerId)
  );
  const heroSlides =
    activeHeroSlides.length > 0
      ? activeHeroSlides
      : visibleDesigners.slice(0, 3).map((d, idx) => ({
        id: `dynamic-${d.id}`,
        imageUrl: d.avatarUrl,
        imageAlt: `${d.name} - ${d.title}`,
        badge: d.categoryNames[0] ?? "Featured Studio",
        designerId: d.id,
        designerTitle: `${d.name} · ${d.title}`,
        meta: `${d.city} · Starting ₹${d.startingPriceInr.toLocaleString("en-IN")} · ${d.rating.toFixed(1)} ★ (${d.reviewCount})`,
        fallbackIdx: idx,
      }));

  useEffect(() => {
    if (carouselPaused || prefersReducedMotion || heroSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [carouselPaused, prefersReducedMotion, heroSlides.length]);

  const safeSlideIdx = heroSlides.length > 0 ? slideIdx % heroSlides.length : 0;
  const activeSlide = heroSlides[safeSlideIdx] ?? HERO_CAROUSEL_SLIDES[0];

  const handleDemoJump = (role: "CUSTOMER" | "DESIGNER", href: string) => {
    const sess = loginDemoRole(role);
    if (!sess) {
      pushToast({
        title: "Account blocked or removed",
        description: "This account is currently suspended or inactive.",
        type: "error",
      });
      return;
    }
    router.push(href);
  };
  const activeReferenceCity =
    state.userLocation?.city ??
    (state.selectedCity !== "All Cities" ? state.selectedCity : null);
  const activeReferenceLabel =
    state.userLocation?.label ?? activeReferenceCity;

  const nearbyWithDistance = visibleDesigners.map((d) => ({
    designer: d,
    distanceKm: getDesignerDistanceKm(d),
  }));

  const sortedNearby = [...nearbyWithDistance].sort((a, b) => {
    if (
      activeReferenceLabel &&
      typeof a.distanceKm === "number" &&
      typeof b.distanceKm === "number"
    ) {
      return (
        a.distanceKm - b.distanceKm ||
        Number(b.designer.isFeatured) - Number(a.designer.isFeatured) ||
        b.designer.rating - a.designer.rating
      );
    }
    return (
      Number(b.designer.isFeatured) - Number(a.designer.isFeatured) ||
      b.designer.rating - a.designer.rating
    );
  });

  const featuredDesigners = sortedNearby.slice(0, 8);
  const hasStudioInImmediateArea =
    Boolean(activeReferenceLabel) &&
    featuredDesigners.some(
      (entry) => typeof entry.distanceKm === "number" && entry.distanceKm <= 12
    );

  const handleUseCurrentLocation = async () => {
    const res = await detectCurrentLocation();
    if (res.ok && res.data) {
      setHeroPlace({
        id: "gps-current",
        label: res.data.label ?? res.data.city,
        secondaryText: "Current GPS Location",
        city: res.data.city,
        state: "India",
        kind: "city",
        lat: res.data.lat,
        lng: res.data.lng,
        source: "MOCK_DIRECTORY",
      });
      pushToast({
        title: `Showing designers near ${res.data.city}`,
        description: "Ranked nearest to your current coordinates.",
        type: "success",
      });
    } else if (res.error) {
      pushToast({
        title: "Location permission needed",
        description: res.error,
        type: "warning",
      });
    }
  };

  const popularCategories = state.categories
    .filter((c) => c.isActive && c.isPopular)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 8);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroPlace) {
      setSelectedPlace(heroPlace);
    }
    const params = new URLSearchParams();
    if (searchService.trim()) params.set("q", searchService.trim());
    const chosenCity = heroPlace?.city ?? activeReferenceCity;
    if (chosenCity && chosenCity !== "All Cities") {
      params.set("city", chosenCity);
    }
    if (heroPlace || state.userLocation) {
      params.set("sort", "nearest");
    }
    if (heroOccasion) params.set("occasion", heroOccasion);
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <div className="w-full overflow-x-clip">
      {/* HERO SECTION */}
      <section className="relative border-b border-brand-border bg-brand-bg pt-6 pb-10 sm:pt-8 sm:pb-12 lg:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[440px] bg-gradient-to-b from-brand-secondary/50 via-brand-highlight/30 to-transparent"
        />
        <div className="gyd-container relative">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-14">
            {/* Editorial Copy + Search */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-border-strong bg-brand-surface px-3.5 py-1.5 text-xs font-semibold text-brand-primary shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                <span>{GYD_BRAND.proposition}</span>
              </div>

              <h1 className="font-editorial text-3xl font-semibold tracking-tight text-brand-text sm:text-5xl xl:text-[58px] xl:leading-[1.07]">
                {state.cms.heroHeadline}
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-brand-text-secondary sm:text-lg">
                {state.cms.heroSubheadline}
              </p>

              {/* Editorial Multi-Field Discovery Bar */}
              <form
                onSubmit={handleHeroSearch}
                className="gyd-panel relative z-20 p-3 sm:p-3.5 grid gap-2.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 items-center overflow-visible"
              >
                <div className="sm:col-span-2 xl:col-span-4 flex items-center gap-2 rounded-xl bg-brand-bg px-3 py-2.5 border border-brand-border">
                  <Search className="h-4 w-4 text-brand-muted-fg shrink-0" />
                  <input
                    type="text"
                    value={searchService}
                    onChange={(e) => setSearchService(e.target.value)}
                    placeholder="Service (Wedding, Decor...)"
                    aria-label="Search by service"
                    className="w-full min-w-0 bg-transparent text-sm text-brand-text placeholder:text-brand-muted focus:outline-none"
                  />
                </div>

                <div className="xl:col-span-3">
                  <LocationPicker
                    compact={false}
                    valueLabel={
                      heroPlace?.label ??
                      state.userLocation?.label ??
                      (state.selectedCity !== "All Cities"
                        ? state.selectedCity
                        : "Select Location")
                    }
                    onSelectPlace={(place) => {
                      setHeroPlace(place);
                      setSelectedPlace(place);
                    }}
                    placeholder="City, town, or village..."
                  />
                </div>

                <div className="xl:col-span-3 flex items-center gap-1.5 rounded-xl bg-brand-bg px-3 py-2.5 border border-brand-border">
                  <Tag className="h-4 w-4 text-brand-primary shrink-0" />
                  <select
                    aria-label="Hero occasion selector"
                    value={heroOccasion}
                    onChange={(e) => setHeroOccasion(e.target.value)}
                    className="w-full min-w-0 bg-transparent text-sm font-medium text-brand-text focus:outline-none cursor-pointer"
                  >
                    {OCCASION_OPTIONS.map((occ) => (
                      <option key={occ} value={occ} className="bg-brand-surface text-brand-text">
                        {occ}
                      </option>
                    ))}
                  </select>
                </div>

                <Button type="submit" variant="primary" size="md" className="sm:col-span-2 xl:col-span-2 w-full">
                  Search
                </Button>
              </form>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button asChild variant="primary" size="lg">
                  <Link href="/explore">
                    Find My Designer
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Link>
                </Button>
                <Button asChild variant="accent" size="lg">
                  <Link href="/categories">Explore Services</Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-brand-text-secondary">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <BadgeCheck className="h-4 w-4 text-brand-accent" />
                  Admin-Verified Designers
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <UserCheck className="h-4 w-4 text-brand-primary" />
                  Home, Studio & Shopping Visits
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Star className="h-4 w-4 text-brand-accent fill-brand-accent" />
                  Consultations from ₹499
                </span>
              </div>
            </motion.div>

            {/* Right Column: 3-Image Auto-Moving Editorial Carousel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="lg:col-span-5 relative"
              onMouseEnter={() => setCarouselPaused(true)}
              onMouseLeave={() => setCarouselPaused(false)}
            >
              <div className="relative mx-auto lg:ml-auto lg:mr-0 w-full max-w-[540px] lg:max-w-[580px] xl:max-w-[640px]">
                <div className="relative h-[370px] sm:h-[420px] lg:h-[430px] xl:h-[460px] 2xl:h-[490px] w-full overflow-hidden rounded-[22px] border border-brand-border shadow-2xl bg-brand-primary">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSlide.id}
                      initial={{ opacity: 0, x: 28 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -28 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={activeSlide.imageUrl}
                        alt={activeSlide.imageAlt}
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 560px"
                        className="object-cover object-center"
                      />
                    </motion.div>
                  </AnimatePresence>

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/25" />

                  {/* Top Slide Bar + Navigation Controls */}
                  <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3 z-10">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-surface/92 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-brand-primary shadow-sm">
                      <span>6 Service Worlds</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label="Previous lookbook slide"
                        onClick={() =>
                          setSlideIdx(
                            (prev) =>
                              (prev - 1 + heroSlides.length) %
                              Math.max(1, heroSlides.length)
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md hover:bg-black/65 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next lookbook slide"
                        onClick={() =>
                          setSlideIdx(
                            (prev) => (prev + 1) % Math.max(1, heroSlides.length)
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md hover:bg-black/65 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Lookbook Caption Card + Carousel Indicators */}
                  <div className="absolute bottom-4 left-4 right-4 z-10 space-y-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {heroSlides.map((s, idx) => (
                        <button
                          key={s.id}
                          type="button"
                          aria-label={`View slide ${idx + 1}: ${s.badge}`}
                          onClick={() => setSlideIdx(idx)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === safeSlideIdx
                            ? "w-7 bg-brand-accent"
                            : "w-2.5 bg-white/55 hover:bg-white/85"
                            }`}
                        />
                      ))}
                    </div>

                    <div className="rounded-2xl bg-brand-surface/95 backdrop-blur-md p-4 border border-brand-border shadow-lg">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-accent">
                            {activeSlide.badge}
                          </p>
                          <p className="font-editorial text-base sm:text-lg font-semibold text-brand-text truncate">
                            {activeSlide.designerTitle}
                          </p>
                          <p className="text-xs text-brand-muted-fg truncate">
                            {activeSlide.meta}
                          </p>
                        </div>
                        <Button asChild size="sm" variant="primary" className="shrink-0">
                          <Link href={`/designers/${activeSlide.designerId}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* POPULAR CATEGORIES */}
      <section className="py-16 sm:py-20 bg-brand-bg">
        <div className="gyd-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="space-y-2">
              <Badge tone="primary">Curated Disciplines</Badge>
              <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-brand-text">
                Popular Categories
              </h2>
              <p className="text-sm sm:text-base text-brand-text-secondary max-w-xl">
                Every life moment deserves craft over guesswork. Explore our dynamic,
                category-driven designer marketplace.
              </p>
            </div>
            <Button asChild variant="outline" size="md">
              <Link href="/categories">
                Browse All Categories
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {popularCategories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.24) }}
              >
                <Link
                  href={`/explore?category=${encodeURIComponent(cat.name)}`}
                  className="gyd-card group block overflow-hidden h-full"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-brand-secondary">
                    <Image
                      src={cat.imageUrl}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 380px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
                    <span className="absolute bottom-3 left-3 rounded-full bg-brand-surface/90 px-2.5 py-0.5 text-[11px] font-semibold text-brand-primary">
                      {cat.subcategories.length} specialties
                    </span>
                  </div>
                  <div className="p-4.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-editorial text-lg font-semibold text-brand-text group-hover:text-brand-primary transition-colors">
                        {cat.name}
                      </h3>
                      <ArrowRight className="h-4 w-4 text-brand-accent transition-transform group-hover:translate-x-1 shrink-0" />
                    </div>
                    <p className="text-xs leading-relaxed text-brand-text-secondary line-clamp-2">
                      {cat.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW GYD WORKS */}
      <section className="py-16 sm:py-20 bg-brand-secondary/45 border-y border-brand-border">
        <div className="gyd-container">
          <div className="text-center max-w-2xl mx-auto space-y-2.5 mb-12">
            <Badge tone="accent">Seamless Experience</Badge>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-brand-text">
              How GYD Works
            </h2>
            <p className="text-sm sm:text-base text-brand-text-secondary">
              From choosing your occasion to walking out with effortless confidence
              in four guided steps.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS_STEPS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.35, delay: idx * 0.06 }}
                  className="gyd-card p-6 flex flex-col justify-between relative"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-secondary text-brand-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-editorial text-3xl font-bold text-brand-muted/50">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="font-editorial text-xl font-semibold text-brand-text">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* NEARBY & FEATURED DESIGNERS */}
      <section className="py-16 sm:py-20 bg-brand-bg">
        <div className="gyd-container">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="primary">
                  <Navigation className="h-3 w-3" />
                  {state.userLocation?.source === "GPS" ||
                    state.userLocation?.source === "AUTO"
                    ? `Nearby GPS · ${activeReferenceLabel}`
                    : activeReferenceLabel
                      ? `Near ${activeReferenceLabel}`
                      : "Verified Talent Across India"}
                </Badge>
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-brand-text">
                {activeReferenceLabel
                  ? `Nearby Designers · ${activeReferenceLabel}`
                  : "Nearby & Featured Designers"}
              </h2>
              <p className="text-sm sm:text-base text-brand-text-secondary max-w-2xl">
                {activeReferenceLabel && !hasStudioInImmediateArea
                  ? `No studio directly inside ${activeReferenceLabel} yet — showing closest verified designers from neighboring towns & nearby cities.`
                  : activeReferenceLabel
                    ? `Sorted closest to ${activeReferenceLabel} across verified partner studios and newly registered designers.`
                    : "Use your current location or search any city, town, or village to discover nearby verified designers sorted by proximity."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="accent"
                size="md"
                onClick={handleUseCurrentLocation}
                disabled={locationStatus === "detecting"}
              >
                <LocateFixed
                  className={`h-4 w-4 ${locationStatus === "detecting" ? "animate-spin" : ""
                    }`}
                />
                {locationStatus === "detecting"
                  ? "Detecting Location..."
                  : state.userLocation?.source === "GPS" ||
                    state.userLocation?.source === "AUTO"
                    ? "Refresh My Location"
                    : "Use Current Location"}
              </Button>
              <Button asChild variant="outline" size="md">
                <Link href="/explore?sort=nearest">
                  Explore All {visibleDesigners.length} Designers
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredDesigners.map((entry, idx) => (
              <DesignerCard
                key={entry.designer.id}
                designer={entry.designer}
                distanceKm={entry.distanceKm}
                index={idx}
              />
            ))}
          </div>
        </div>
      </section>

      {/* OCCASION INSPIRATION */}
      <section className="py-16 sm:py-20 bg-brand-surface border-y border-brand-border">
        <div className="gyd-container">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <Badge tone="accent">Occasion Lookbooks</Badge>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-brand-text">
              Occasion Inspiration
            </h2>
            <p className="text-sm sm:text-base text-brand-text-secondary">
              Start with your celebration or daily setting—we pair you with stylists
              who master its exact mood.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {OCCASION_INSPIRATION_COLLECTIONS.map((col, idx) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
              >
                <Link
                  href={`/explore?category=${encodeURIComponent(
                    col.filterCategory
                  )}&occasion=${encodeURIComponent(col.filterOccasion)}`}
                  className="group relative block aspect-[16/11] overflow-hidden rounded-[18px] border border-brand-border shadow-sm"
                >
                  <Image
                    src={col.imageUrl}
                    alt={col.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 480px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-accent">
                      {col.designerCount} curated pros
                    </span>
                    <h3 className="font-editorial text-2xl font-semibold mt-0.5">
                      {col.title}
                    </h3>
                    <p className="text-xs text-white/85 mt-0.5">{col.subtitle}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS (CLEARLY MARKED DEMO DATA) */}
      <section className="py-16 sm:py-20 bg-brand-bg">
        <div className="gyd-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge tone="neutral">Sample Demo Testimonials</Badge>
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-brand-text">
                Client Stories & Transformations
              </h2>
              <p className="text-xs text-brand-muted-fg">
                Note: Testimonials below are clearly marked sample demonstration data
                until verified live client reviews are published.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {state.cms.testimonials.map((item) => (
              <article key={item.id} className="gyd-card p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-brand-accent text-brand-accent"
                        />
                      ))}
                    </div>
                    {item.isDemoSample && (
                      <Badge tone="neutral" className="text-[10px]">
                        Demo Sample
                      </Badge>
                    )}
                  </div>
                  <p className="font-editorial text-lg leading-relaxed text-brand-text">
                    “{item.quote}”
                  </p>
                </div>
                <div className="mt-6 border-t border-brand-border pt-4">
                  <p className="text-sm font-bold text-brand-text">
                    {item.authorName}
                  </p>
                  <p className="text-xs text-brand-muted-fg">
                    {item.occasion} · {item.city}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* BECOME A DESIGNER CTA + DEMO WORKSPACE ACCESS */}
      <section className="py-16 sm:py-20 bg-brand-secondary/50 border-t border-brand-border">
        <div className="gyd-container space-y-12">
          <div className="gyd-panel overflow-hidden grid lg:grid-cols-12">
            <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-5">
              <Badge tone="accent" className="w-fit">
                For Stylists, Artists & Decorators
              </Badge>
              <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-brand-text">
                {state.cms.becomeDesignerHeadline}
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-brand-text-secondary max-w-xl">
                {state.cms.becomeDesignerSubheadline}
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Button asChild variant="primary" size="lg">
                  <Link href="/become-a-designer">
                    Join as a Designer
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleDemoJump("DESIGNER", "/designer/dashboard")}
                >
                  Preview Designer Studio
                </Button>
              </div>
            </div>
            <div className="lg:col-span-5 relative min-h-[260px] bg-brand-primary">
              <Image
                src="/images/hero/become-designer.jpg"
                alt="Creative designer atelier moodboard and textiles"
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
              />
            </div>
          </div>

          {/* Connected Customer & Designer Workspaces Strip */}
          <div className="gyd-card p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <Badge tone="primary">Connected Style Workspaces</Badge>
              <h3 className="font-editorial text-2xl font-semibold text-brand-text">
                Dedicated Portals for Clients & Designers
              </h3>
              <p className="text-sm text-brand-text-secondary max-w-2xl">
                Track upcoming appointments, shortlisted stylists, bespoke service
                menus, studio schedules, and direct client conversations in real time.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Button
                variant="primary"
                size="md"
                onClick={() => handleDemoJump("CUSTOMER", "/customer/dashboard")}
              >
                Customer Portal
              </Button>
              <Button
                variant="accent"
                size="md"
                onClick={() => handleDemoJump("DESIGNER", "/designer/dashboard")}
              >
                Designer Studio
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
