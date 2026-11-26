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
import { formatDistanceKm, getDesignerNeighborhood } from "@/lib/location/nearby";
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
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25) }}
      className={cn(
        "gyd-card group overflow-hidden flex",
        layout === "list" ? "flex-col sm:flex-row" : "flex-col"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-brand-secondary/50 shrink-0",
          layout === "list"
            ? "h-56 sm:h-auto sm:w-64"
            : "aspect-[4/3] w-full"
        )}
      >
        <Image
          src={designer.avatarUrl}
          alt={`${designer.name} - ${designer.title}`}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover object-[50%_18%] transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          {designer.isVerified && (
            <Badge className="bg-brand-surface/95 text-brand-primary border-0 shadow-sm">
              <BadgeCheck className="h-3.5 w-3.5 text-brand-accent" />
              Verified
            </Badge>
          )}
          {designer.isFeatured && (
            <Badge tone="accent" className="shadow-sm">
              Featured
            </Badge>
          )}
        </div>

        <button
          type="button"
          onClick={handleToggleFav}
          aria-label={fav ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-colors cursor-pointer",
            fav
              ? "bg-brand-accent text-white"
              : "bg-black/40 text-white hover:bg-black/60"
          )}
        >
          <Heart className={cn("h-4 w-4", fav && "fill-current")} />
        </button>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-white text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 font-medium truncate">
            <MapPin className="h-3 w-3 text-brand-accent shrink-0" />
            <span className="truncate">
              {neighborhood !== designer.city
                ? `${neighborhood}, ${designer.city}`
                : designer.city}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 font-semibold shrink-0">
            <Star className="h-3 w-3 fill-brand-accent text-brand-accent" />
            {designer.rating.toFixed(1)} ({designer.reviewCount})
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-editorial text-xl font-semibold text-brand-text leading-snug">
                <Link
                  href={`/designers/${designer.id}`}
                  className="hover:text-brand-primary transition-colors"
                >
                  {designer.name}
                </Link>
              </h3>
              <p className="mt-0.5 text-sm font-medium text-brand-muted-fg line-clamp-1">
                {designer.title}
              </p>
            </div>
            {typeof computedDistance === "number" && (
              <Badge tone="info" className="shrink-0 text-[11px]">
                <Navigation className="h-3 w-3" />
                {formatDistanceKm(computedDistance)}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {designer.categoryNames.slice(0, 3).map((cat) => (
              <Badge key={cat} tone="primary" className="text-[11px]">
                {cat}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-text-secondary">
            <span>{designer.experienceYears} yrs experience</span>
            <span className="inline-flex items-center gap-1 text-brand-success font-medium">
              <CalendarClock className="h-3.5 w-3.5" />
              {designer.availabilitySummary}
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-brand-border pt-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-brand-muted-fg font-semibold">
              Starting at
            </p>
            <p className="text-base font-bold text-brand-text">
              {formatINR(designer.startingPriceInr)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/designers/${designer.id}`}>View Profile</Link>
            </Button>
            <Button asChild variant="primary" size="sm">
              <Link href={`/book/${designer.id}`}>Book</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
