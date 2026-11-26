"use client";

import React, { useState } from "react";
import { CalendarClock, Check, Eye, Play, X } from "lucide-react";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/common/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { APPOINTMENT_TYPE_META } from "@/constants/gyd";
import { useGydStore } from "@/features/store/gyd-store";
import { formatDateShort, formatINR } from "@/lib/utils";
import { Booking } from "@/types";

export default function DesignerBookingsPage() {
  const { pushToast } = useToast();
  const { state, updateBookingStatus } = useGydStore();
  const did = state.session?.designerId ?? "des-1";

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [inspectTarget, setInspectTarget] = useState<Booking | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [altSlotTarget, setAltSlotTarget] = useState<Booking | null>(null);
  const [altSlotText, setAltSlotText] = useState("29 Nov · 04:00 PM");

  const myBookings = state.bookings.filter((b) => b.designerId === did);
  const filtered = myBookings.filter((b) =>
    statusFilter === "ALL" ? true : b.status === statusFilter
  );

  const handleTransition = (
    bkg: Booking,
    nextStatus: Booking["status"],
    note: string
  ) => {
    const res = updateBookingStatus(bkg.id, nextStatus, note);
    if (!res.ok) {
      pushToast({
        title: "Scheduling Conflict",
        description: res.error,
        type: "error",
      });
      return;
    }
    pushToast({
      title: `${bkg.bookingCode} updated`,
      description: `Status is now ${nextStatus.replace(/_/g, " ")}.`,
      type: "success",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-text">
          Booking Management
        </h1>
        <p className="text-sm text-brand-text-secondary">
          Review client requirements, prevent slot overlaps, accept or suggest
          alternate slots, and mark services completed.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          "ALL",
          "PENDING",
          "ACCEPTED",
          "CONFIRMED",
          "IN_PROGRESS",
          "COMPLETED",
          "CANCELLED",
        ].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${
              statusFilter === st
                ? "bg-brand-primary text-brand-primary-fg"
                : "bg-brand-surface border border-brand-border text-brand-text-secondary"
            }`}
          >
            {st.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No bookings in this status"
          description="Incoming customer requests for your studio appear here automatically."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <article key={b.id} className="gyd-card p-5 sm:p-6 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="primary">{b.bookingCode}</Badge>
                    <BookingStatusBadge status={b.status} />
                    <PaymentStatusBadge status={b.paymentStatus} />
                  </div>
                  <h2 className="font-editorial text-xl font-semibold text-brand-text">
                    {b.serviceTitle} · Client: {b.customerName}
                  </h2>
                  <p className="text-xs sm:text-sm text-brand-text-secondary">
                    {formatDateShort(b.date)} ({b.startTime} – {b.endTime}) ·{" "}
                    {APPOINTMENT_TYPE_META[b.appointmentType].label} ·{" "}
                    {b.occasion} · {b.city}
                  </p>
                </div>

                <div className="lg:text-right">
                  <p className="text-xs uppercase tracking-wider text-brand-muted-fg font-semibold">
                    Gross Booking Value
                  </p>
                  <p className="text-xl font-bold text-brand-text">
                    {formatINR(b.totalAmountInr)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-brand-bg p-3.5 text-xs text-brand-text-secondary space-y-1">
                <p>
                  <strong className="text-brand-text">Client Brief:</strong>{" "}
                  {b.requirements.additionalRequirements}
                </p>
                <p>
                  <strong className="text-brand-text">Budget / Party:</strong>{" "}
                  {formatINR(b.requirements.budgetInr)} ·{" "}
                  {b.requirements.peopleCount} people · Style:{" "}
                  {b.requirements.preferredStyle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-brand-border">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInspectTarget(b)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Requirements & Refs
                </Button>

                {b.status === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        handleTransition(
                          b,
                          "ACCEPTED",
                          "Designer verified availability and accepted booking."
                        )
                      }
                    >
                      <Check className="h-3.5 w-3.5" />
                      Accept Booking
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAltSlotTarget(b)}
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      Suggest Alt Slot
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-brand-error"
                      onClick={() => setRejectTarget(b)}
                    >
                      <X className="h-3.5 w-3.5" />
                      Decline
                    </Button>
                  </>
                )}

                {b.status === "ACCEPTED" && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      handleTransition(
                        b,
                        "CONFIRMED",
                        "Appointment confirmed by designer."
                      )
                    }
                  >
                    Confirm Appointment
                  </Button>
                )}

                {b.status === "CONFIRMED" && (
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() =>
                      handleTransition(
                        b,
                        "IN_PROGRESS",
                        "Styling session started."
                      )
                    }
                  >
                    <Play className="h-3.5 w-3.5" />
                    Start Appointment
                  </Button>
                )}

                {(b.status === "CONFIRMED" || b.status === "IN_PROGRESS") && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      handleTransition(
                        b,
                        "COMPLETED",
                        "Service marked completed; customer confirmation & review unlocked."
                      )
                    }
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark Completed
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Requirements Modal */}
      <Modal
        open={Boolean(inspectTarget)}
        onClose={() => setInspectTarget(null)}
        title={`Client Brief · ${inspectTarget?.bookingCode ?? ""}`}
        description={inspectTarget?.customerName}
      >
        {inspectTarget && (
          <div className="space-y-3 text-sm">
            <p>
              <strong>Occasion Date:</strong>{" "}
              {formatDateShort(inspectTarget.requirements.occasionDate)}
            </p>
            <p>
              <strong>Visit Address:</strong> {inspectTarget.addressFull}
            </p>
            <p>
              <strong>Reference Files:</strong>{" "}
              {inspectTarget.requirements.referenceImageNames.join(", ") || "None"}
            </p>
            <p>
              <strong>Notes:</strong>{" "}
              {inspectTarget.requirements.notes || "No additional notes"}
            </p>
          </div>
        )}
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title={`Decline ${rejectTarget?.bookingCode ?? ""}`}
        description="Provide a clear reason for the customer."
      >
        <div className="space-y-4">
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Prior destination wedding commitment on the same afternoon."
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Back
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!rejectTarget) return;
                updateBookingStatus(
                  rejectTarget.id,
                  "REJECTED",
                  rejectReason || "Declined by designer.",
                  { rejectionReason: rejectReason || "Schedule unavailable" }
                );
                setRejectTarget(null);
                setRejectReason("");
                pushToast({ title: "Booking declined", type: "info" });
              }}
            >
              Confirm Decline
            </Button>
          </div>
        </div>
      </Modal>

      {/* Suggest Alternative Slot Modal */}
      <Modal
        open={Boolean(altSlotTarget)}
        onClose={() => setAltSlotTarget(null)}
        title="Suggest Alternative Slot"
        description={`Propose another date/time for ${altSlotTarget?.customerName ?? ""}`}
      >
        <div className="space-y-4">
          <Input
            value={altSlotText}
            onChange={(e) => setAltSlotText(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAltSlotTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!altSlotTarget) return;
                updateBookingStatus(
                  altSlotTarget.id,
                  "PENDING",
                  `Designer suggested alternative slot: ${altSlotText}`,
                  { rescheduleSuggestedSlot: altSlotText }
                );
                setAltSlotTarget(null);
                pushToast({
                  title: "Alternative slot sent to client",
                  type: "success",
                });
              }}
            >
              Send Suggestion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
