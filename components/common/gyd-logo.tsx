"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface GydLogoProps {
  href?: string;
  compact?: boolean;
  className?: string;
  subtitle?: string;
}

export function GydLogo({
  href = "/",
  compact = false,
  className,
  subtitle,
}: GydLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus rounded-xl",
        className
      )}
    >
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-brand-primary-fg shadow-sm transition-transform duration-200 group-hover:scale-[1.03]">
        <svg
          viewBox="0 0 36 36"
          className="h-5 w-5"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M18 5C10.82 5 5 10.82 5 18C5 25.18 10.82 31 18 31C24.2 31 29.4 26.64 30.69 20.8H19.5V16.8H31C30.38 10.17 24.8 5 18 5Z"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="24.5" cy="11.5" r="2.75" fill="#F07865" />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-editorial text-lg font-bold tracking-tight text-brand-text">
            GYD
            <span className="ml-1.5 text-xs font-sans font-semibold uppercase tracking-[0.16em] text-brand-accent">
              Atelier
            </span>
          </span>
          <span className="text-[11px] font-medium tracking-wide text-brand-muted-fg">
            {subtitle ?? "Get Your Designer"}
          </span>
        </span>
      )}
    </Link>
  );
}
