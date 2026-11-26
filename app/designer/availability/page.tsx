"use client";

import React from "react";
import { CalendarOff, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useGydStore } from "@/features/store/gyd-store";
import { formatDateShort } from "@/lib/utils";

export default function DesignerAvailabilityPage() {
  const { pushToast } = useToast();
  const { state, toggleAvailabilitySlot, toggleBlockedDate } = useGydStore();
  const did = state.session?.designerId ?? "des-1";
  const schedule = state.availability.find((a) => a.designerId === did);

  if (!schedule) {
    return null;
  }

  const dates = Array.from(new Set(schedule.slots.map((s) => s.date)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-text">
          Availability & Conflict Calendar
        </h1>
        <p className="text-sm text-brand-text-secondary">
          Toggle open slots or block entire days. Confirmed customer bookings lock
          slots automatically to prevent double booking.
        </p>
      </div>

      <div className="gyd-card p-5 flex flex-wrap items-center gap-4 text-xs">
        <span className="font-semibold text-brand-text">
          Working Hours: {schedule.workingHoursStart} – {schedule.workingHoursEnd}
        </span>
        <span className="text-brand-muted-fg">
          Break: {schedule.breakStart} – {schedule.breakEnd}
        </span>
        <span className="text-brand-muted-fg">
          Working Days: {schedule.workingDays.join(", ")}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {dates.map((date) => {
          const isBlocked = schedule.blockedDates.includes(date);
          const daySlots = schedule.slots.filter((s) => s.date === date);
          return (
            <div key={date} className="gyd-card p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-editorial text-xl font-semibold text-brand-text">
                    {formatDateShort(date)}
                  </h2>
                  <p className="text-xs text-brand-muted-fg">
                    {isBlocked
                      ? "Date blocked — hidden from booking"
                      : `${daySlots.filter((s) => s.isAvailable).length} slots open`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={isBlocked ? "primary" : "outline"}
                  onClick={() => {
                    toggleBlockedDate(did, date);
                    pushToast({
                      title: isBlocked ? "Date unblocked" : "Date blocked",
                      description: formatDateShort(date),
                      type: "info",
                    });
                  }}
                >
                  <CalendarOff className="h-3.5 w-3.5" />
                  {isBlocked ? "Unblock Day" : "Block Day"}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {daySlots.map((slot) => {
                  const lockedByBooking = Boolean(slot.bookedByBookingId);
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={lockedByBooking || isBlocked}
                      onClick={() => toggleAvailabilitySlot(did, slot.id)}
                      className={`rounded-xl border p-3 text-left text-xs transition-all ${
                        lockedByBooking
                          ? "border-brand-accent/40 bg-brand-highlight text-brand-accent cursor-not-allowed"
                          : isBlocked || !slot.isAvailable
                            ? "border-brand-border bg-brand-surface-muted text-brand-muted-fg cursor-pointer"
                            : "border-brand-success-border bg-brand-success-bg text-brand-success cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{slot.startTime}</span>
                        {lockedByBooking ? (
                          <Lock className="h-3.5 w-3.5" />
                        ) : slot.isAvailable && !isBlocked ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11px]">
                        {lockedByBooking
                          ? "Booked (Locked)"
                          : isBlocked
                            ? "Day Blocked"
                            : slot.isAvailable
                              ? "Open for Booking"
                              : "Paused"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
