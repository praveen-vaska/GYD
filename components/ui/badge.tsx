import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      tone: {
        primary:
          "border-brand-primary/20 bg-brand-secondary text-brand-secondary-fg",
        accent:
          "border-brand-accent/25 bg-brand-highlight text-brand-accent",
        neutral:
          "border-brand-border bg-brand-surface-muted text-brand-text-secondary",
        success:
          "border-brand-success-border bg-brand-success-bg text-brand-success",
        warning:
          "border-brand-warning-border bg-brand-warning-bg text-brand-warning",
        error:
          "border-brand-error-border bg-brand-error-bg text-brand-error",
        info:
          "border-brand-info-border bg-brand-info-bg text-brand-info",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
