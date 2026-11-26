import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateShort(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatTimeRange(start: string, end?: string): string {
  return end ? `${start} – ${end}` : start;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function calculateCommissionBreakdown(
  grossAmount: number,
  commissionRatePercent: number
) {
  const platformFee = Math.round((grossAmount * commissionRatePercent) / 100);
  const netDesignerEarnings = Math.max(0, grossAmount - platformFee);
  return {
    grossAmount,
    commissionRatePercent,
    platformFee,
    netDesignerEarnings,
  };
}

export function generateBookingCode(sequence: number): string {
  return `GYD-${String(26000 + sequence)}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
