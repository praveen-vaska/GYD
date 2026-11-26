"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarClock,
  Heart,
  MapPin,
  Navigation,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useGydStore } from "@/features/store/gyd-store";
import {
  formatDistanceKm,
  getDesignerNeighborhood,
} from "@/lib/location/nearby";
import { cn, formatINR } from "@/lib/utils";
import { DesignerProfile } from "@/types";

interface DesignerCardProps {
  designer: DesignerProfile;
  layout?: "grid" | "list";
  index?: number;
  distanceKm?: number | null;
}

export function DesignerCard({
  designer,
  layout = "grid",
  index = 0,
  distanceKm,
}: DesignerCardProps) {
  const { isFavourited, toggleFavourite, getDesignerDistanceKm } = useGydStore();
  const { pushToast } = useToast();
  const fav = isFavourited(designer.id);

  const computedDistance =
    typeof distanceKm === "number"
      ? distanceKm
      : getDesignerDistanceKm(designer);

  const neighborhood = getDesignerNeighborhood(designer);

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = toggleFavourite(designer.id);
    pushToast({
      title: res.data ? "Saved to Wishlist" : "Removed from Wishlist",
      description: `${designer.name} ${res.data ? "added to" : "removed from"} your saved designers.`,
      type: "info",
    });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.24) }}
      className={cn(
        "gyd-card group overflow-hidden flex h-full border border-brand-border-strong hover:border-brand-primary/40 hover:shadow-md",
        layout === "list" ? "flex-col sm:flex-row" : "flex-col"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-brand-secondary/50 shrink-0",
          layout === "list"
            ? "h-52 sm:h-auto sm:w-60"
            : "aspect-[4/3] w-full"
        )}
      >
        <Image
          src={designer.avatarUrl}
          alt={`${designer.name} - ${designer.title}`}
          fill
          sizes="(max-width: 768px) 100vw, 380px"
          className="object-cover object-[50%_18%] transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

        <div className="absolute left-2.5 top-2.5 flex flex-wrap items-center gap-1">
          {designer.isVerified && (
            <Badge className="bg-brand-surface/95 text-brand-primary border-0 shadow-sm px-2 py-0.5 text-[10px]">
              <BadgeCheck className="h-3 w-3 text-brand-accent" />
              Verified
            </Badge>
          )}
          {designer.isFeatured && (
            <Badge tone="accent" className="shadow-sm px-2 py-0.5 text-[10px]">
              Featured
            </Badge>
          )}
        </div>

        <button
          type="button"
          onClick={handleToggleFav}
          aria-label={fav ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-colors cursor-pointer",
            fav
              ? "bg-brand-accent text-white"
              : "bg-black/40 text-white hover:bg-black/60"
          )}
        >
          <Heart className={cn("h-3.5 w-3.5", fav && "fill-current")} />
        </button>

        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 text-white text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-sm px-2 py-0.5 font-medium truncate">
            <MapPin className="h-3 w-3 text-brand-accent shrink-0" />
            <span className="truncate">
              {neighborhood !== designer.city
                ? `${neighborhood}, ${designer.city}`
                : designer.city}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-sm px-2 py-0.5 font-semibold shrink-0">
            <Star className="h-3 w-3 fill-brand-accent text-brand-accent" />
            {designer.rating.toFixed(1)} ({designer.reviewCount})
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-editorial text-lg font-semibold text-brand-text leading-snug truncate">
                <Link
                  href={`/designers/${designer.id}`}
                  className="hover:text-brand-primary transition-colors"
                >
                  {designer.name}
                </Link>
              </h3>
              <p className="mt-0.5 text-xs font-medium text-brand-muted-fg line-clamp-1">
                {designer.title}
              </p>
            </div>
            {typeof computedDistance === "number" && (
              <Badge tone="info" className="shrink-0 text-[10px] px-2 py-0.5">
                <Navigation className="h-2.5 w-2.5" />
                {formatDistanceKm(computedDistance)}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            {designer.categoryNames.slice(0, 2).map((cat) => (
              <Badge
                key={cat}
                tone="primary"
                className="text-[10px] px-2 py-0.5"
              >
                {cat}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-brand-text-secondary">
            <span>{designer.experienceYears} yrs exp</span>
            <span className="inline-flex items-center gap-1 text-brand-success font-medium truncate">
              <CalendarClock className="h-3 w-3 shrink-0" />
              <span className="truncate">{designer.availabilitySummary}</span>
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-brand-border pt-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-brand-muted-fg font-semibold">
              From
            </p>
            <p className="text-sm font-bold text-brand-text truncate">
              {formatINR(designer.startingPriceInr)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs"
            >
              <Link href={`/designers/${designer.id}`}>View</Link>
            </Button>
            <Button
              asChild
              variant="primary"
              size="sm"
              className="h-8 px-3 text-xs"
            >
              <Link href={`/book/${designer.id}`}>Book</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
