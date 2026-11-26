import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10.5 w-full rounded-xl border border-brand-border-strong bg-brand-surface px-3.5 py-2 text-sm text-brand-text placeholder:text-brand-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus disabled:cursor-not-allowed disabled:opacity-60",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[96px] w-full rounded-xl border border-brand-border-strong bg-brand-surface px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus disabled:cursor-not-allowed disabled:opacity-60",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-10.5 w-full rounded-xl border border-brand-border-strong bg-brand-surface px-3.5 py-2 text-sm text-brand-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus disabled:cursor-not-allowed disabled:opacity-60",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
