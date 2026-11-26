"use client";

import React from "react";
import { LucideIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-brand-secondary/70",
        className
      )}
    />
  );
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "gyd-card flex flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-secondary text-brand-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-editorial text-xl font-semibold text-brand-text">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-sm text-brand-text-secondary">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="sm" className="mt-5">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
