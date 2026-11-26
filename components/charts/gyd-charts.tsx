"use client";

import React from "react";
import { formatINR } from "@/lib/utils";

export interface BarDatum {
  label: string;
  value: number;
  secondaryValue?: number;
}

export function EditorialBarChart({
  data,
  formatAsCurrency = false,
  height = 200,
}: {
  data: BarDatum[];
  formatAsCurrency?: boolean;
  height?: number;
}) {
  const maxVal = Math.max(
    1,
    ...data.map((d) => Math.max(d.value, d.secondaryValue ?? 0))
  );

  return (
    <div className="w-full">
      <div
        className="flex items-end gap-2 sm:gap-4 pt-6 pb-2"
        style={{ height }}
      >
        {data.map((item) => {
          const pct = Math.max(8, Math.round((item.value / maxVal) * 100));
          const secPct =
            typeof item.secondaryValue === "number"
              ? Math.max(6, Math.round((item.secondaryValue / maxVal) * 100))
              : 0;
          return (
            <div
              key={item.label}
              className="group relative flex-1 h-full flex flex-col items-center justify-end gap-1.5"
            >
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 z-10 whitespace-nowrap rounded-lg bg-brand-primary px-2 py-1 text-[10px] font-semibold text-brand-primary-fg shadow-md">
                {formatAsCurrency ? formatINR(item.value) : item.value}
              </div>

              <div className="w-full h-full flex items-end justify-center gap-1">
                <div
                  className="w-full max-w-[26px] rounded-t-lg bg-brand-primary transition-all duration-300 group-hover:bg-brand-accent"
                  style={{ height: `${pct}%` }}
                />
                {typeof item.secondaryValue === "number" && (
                  <div
                    className="w-full max-w-[16px] rounded-t-lg bg-brand-accent/80 transition-all duration-300"
                    style={{ height: `${secPct}%` }}
                  />
                )}
              </div>
              <span className="text-[11px] font-medium text-brand-muted-fg truncate max-w-full">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HorizontalDistributionChart({
  items,
}: {
  items: Array<{ label: string; value: number; displayValue: string }>;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3.5">
      {items.map((item, idx) => {
        const pct = Math.max(8, Math.round((item.value / max) * 100));
        return (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-brand-text truncate">{item.label}</span>
              <span className="text-brand-muted-fg shrink-0 ml-2">
                {item.displayValue}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-secondary/70">
              <div
                className={
                  idx % 2 === 0
                    ? "h-full rounded-full bg-brand-primary transition-all duration-500"
                    : "h-full rounded-full bg-brand-accent transition-all duration-500"
                }
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
