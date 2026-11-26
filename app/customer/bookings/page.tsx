"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarClock,
  CreditCard,
  Download,
  Eye,
  MessageSquare,
  Star,
  XCircle,
} from "lucide-react";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/common/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { APPOINTMENT_TYPE_META } from "@/constants/gyd";
import { useGydStore } from "@/features/store/gyd-store";
import { formatDateShort, formatINR } from "@/lib/utils";
import { Booking } from "@/types";

function CustomerBookingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { pushToast } = useToast();
  const {
    state,
    updateBookingStatus,
    authorizeDemoPayment,
    submitReview,
    startOrOpenConversation,
  } = useGydStore();

  const initialTab =
    searchParams.get("tab") === "history" ? "history" : "upcoming";
  const [tab, setTab] = useState<"all" | "upcoming" | "history">(initialTab);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [rescheduleNote, setRescheduleNote] = useState("Next Saturday · 11:00 AM");
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const uid = state.session?.userId ?? "usr-cust-1";
  const myBookings = state.bookings.filter((b) => b.customerId === uid);

  const filtered = myBookings.filter((b) => {
    if (tab === "upcoming") {
      return [
        "PENDING",
        "ACCEPTED",
        "AWAITING_PAYMENT",
        "CONFIRMED",
        "IN_PROGRESS",
      ].includes(b.status);
    }
    if (tab === "history") {
      return [
        "COMPLETED",
        "CANCELLED",
        "REJECTED",
        "REFUND_REQUESTED",
        "REFUNDED",
      ].includes(b.status);
    }
    return true;
  });

  const handleDownloadInvoice = (bkg: Booking) => {
    const content = [
      `GYD – GET YOUR DESIGNER | BOOKING SUMMARY & DEMO INVOICE`,
      `Booking Code: ${bkg.bookingCode}`,
      `Customer: ${bkg.customerName}`,
      `Designer: ${bkg.designerName}`,
      `Service: ${bkg.serviceTitle}`,
      `Occasion: ${bkg.occasion}`,
      `Date & Slot: ${bkg.date} (${bkg.startTime} - ${bkg.endTime})`,
      `Location: ${bkg.addressFull}`,
      `Base Price: ${formatINR(bkg.basePriceInr)}`,
      `Travel Fee: ${formatINR(bkg.travelFeeInr)}`,
      `Platform Care Fee: ${formatINR(bkg.platformServiceFeeInr)}`,
      `Discount: -${formatINR(bkg.discountInr)}`,
      `Total: ${formatINR(bkg.totalAmountInr)}`,
      `Booking Status: ${bkg.status}`,
      `Payment Status: ${bkg.paymentStatus} (Sandbox Demo)`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bkg.bookingCode}-GYD-Invoice.txt`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({
      title: "Invoice downloaded",
      description: `Saved ${bkg.bookingCode}-GYD-Invoice.txt`,
      type: "success",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-brand-text">
            My Bookings
          </h1>
          <p className="text-sm text-brand-text-secondary">
            View timelines, reschedule, contact designers, download receipts, or
            leave reviews.
          </p>
        </div>
        <Button asChild variant="primary">
          <Link href="/explore">Book Another Session</Link>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["upcoming", "Upcoming Appointments"],
            ["history", "Booking History"],
            ["all", "All Bookings"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer ${
              tab === key
                ? "bg-brand-primary text-brand-primary-fg"
                : "bg-brand-surface border border-brand-border text-brand-text-secondary hover:bg-brand-surface-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No bookings in this view"
          description="Explore verified designers and schedule an appointment tailored to your occasion."
          actionLabel="Explore Designers"
          onAction={() => router.push("/explore")}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((bkg) => {
            const alreadyReviewed = state.reviews.some(
              (r) => r.bookingId === bkg.id
            );
            const canCancel = [
              "PENDING",
              "ACCEPTED",
              "AWAITING_PAYMENT",
              "CONFIRMED",
            ].includes(bkg.status);

            return (
              <article key={bkg.id} className="gyd-card p-5 sm:p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="primary">{bkg.bookingCode}</Badge>
                      <BookingStatusBadge status={bkg.status} />
                      <PaymentStatusBadge status={bkg.paymentStatus} />
                    </div>
                    <h2 className="font-editorial text-xl font-semibold text-brand-text">
                      {bkg.serviceTitle} · {bkg.designerName}
                    </h2>
                    <p className="text-xs sm:text-sm text-brand-text-secondary">
                      {formatDateShort(bkg.date)} ({bkg.startTime} – {bkg.endTime}) ·{" "}
                      {APPOINTMENT_TYPE_META[bkg.appointmentType].label} · {bkg.city}
                    </p>
                  </div>

                  <div className="lg:text-right">
                    <p className="text-xs uppercase tracking-wider text-brand-muted-fg font-semibold">
                      Total Fee
                    </p>
                    <p className="text-xl font-bold text-brand-text">
                      {formatINR(bkg.totalAmountInr)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-brand-border">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDetailBooking(bkg)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View & Track
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      startOrOpenConversation(bkg.designerId, bkg.id);
                      router.push("/customer/messages");
                    }}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Contact Designer
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadInvoice(bkg)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Invoice
                  </Button>

                  {bkg.paymentStatus === "UNPAID" &&
                    ["ACCEPTED", "AWAITING_PAYMENT", "PENDING"].includes(
                      bkg.status
                    ) && (
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => {
                          authorizeDemoPayment(bkg.id, bkg.paymentMode);
                          pushToast({
                            title: "Sandbox Payment Recorded",
                            description: `Demo Razorpay order created for ${bkg.bookingCode}.`,
                            type: "success",
                          });
                        }}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Pay Deposit / Demo Hold
                      </Button>
                    )}

                  {canCancel && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRescheduleTarget(bkg)}
                      >
                        <CalendarClock className="h-3.5 w-3.5" />
                        Reschedule
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-brand-error"
                        onClick={() => setCancelTarget(bkg)}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    </>
                  )}

                  {bkg.status === "COMPLETED" && !alreadyReviewed && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setReviewTarget(bkg)}
                    >
                      <Star className="h-3.5 w-3.5" />
                      Leave Review
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Tracking & Detail Modal */}
      <Modal
        open={Boolean(detailBooking)}
        onClose={() => setDetailBooking(null)}
        title={`Booking ${detailBooking?.bookingCode ?? ""}`}
        description={detailBooking?.serviceTitle}
      >
        {detailBooking && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl bg-brand-bg p-4 space-y-2">
              <p>
                <strong>Address:</strong> {detailBooking.addressFull}
              </p>
              <p>
                <strong>Preferred Style:</strong>{" "}
                {detailBooking.requirements.preferredStyle}
              </p>
              <p>
                <strong>Client Brief:</strong>{" "}
                {detailBooking.requirements.additionalRequirements}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg mb-2">
                Status Timeline
              </p>
              <div className="space-y-2 border-l-2 border-brand-primary pl-3">
                {detailBooking.statusHistory.map((h) => (
                  <div key={h.id} className="text-xs">
                    <p className="font-bold text-brand-text">
                      {h.status} · {h.changedByRole}
                    </p>
                    <p className="text-brand-text-secondary">{h.note}</p>
                    <p className="text-[11px] text-brand-muted-fg">
                      {formatDateShort(h.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Modal */}
      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title={`Cancel ${cancelTarget?.bookingCode ?? ""}?`}
        description={`Policy: Free cancellation ${state.settings.cancellationFreeHours}+ hrs prior; ${state.settings.partialRefundPercent}% refund inside ${state.settings.cancellationFreeHours} hrs.`}
      >
        <div className="space-y-4">
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Share reason for cancellation..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Keep Booking
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!cancelTarget) return;
                updateBookingStatus(
                  cancelTarget.id,
                  "CANCELLED",
                  cancelReason || "Cancelled by customer under policy.",
                  { cancellationReason: cancelReason || "Customer requested cancellation" }
                );
                setCancelTarget(null);
                setCancelReason("");
                pushToast({
                  title: "Booking cancelled",
                  description: "Refund eligibility evaluated per GYD policy.",
                  type: "info",
                });
              }}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        open={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        title="Request Rescheduling"
        description={`Propose an alternate slot for ${rescheduleTarget?.designerName ?? ""}`}
      >
        <div className="space-y-4">
          <Input
            value={rescheduleNote}
            onChange={(e) => setRescheduleNote(e.target.value)}
            placeholder="e.g. Sunday, 30 Nov · 3:00 PM"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRescheduleTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!rescheduleTarget) return;
                updateBookingStatus(
                  rescheduleTarget.id,
                  rescheduleTarget.status,
                  `Customer requested reschedule to: ${rescheduleNote}`,
                  { rescheduleSuggestedSlot: rescheduleNote }
                );
                setRescheduleTarget(null);
                pushToast({
                  title: "Reschedule request sent",
                  description: "Your designer will confirm slot availability.",
                  type: "success",
                });
              }}
            >
              Send Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        open={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        title={`Review ${reviewTarget?.designerName ?? ""}`}
        description={reviewTarget?.serviceTitle}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setReviewRating(num)}
                className="p-1 cursor-pointer"
              >
                <Star
                  className={`h-6 w-6 ${
                    num <= reviewRating
                      ? "fill-brand-accent text-brand-accent"
                      : "text-brand-muted"
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="How did the designer transform your occasion or space?"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReviewTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!reviewTarget) return;
                const res = submitReview(
                  reviewTarget.id,
                  reviewRating,
                  reviewComment
                );
                if (!res.ok) {
                  pushToast({
                    title: "Cannot submit review",
                    description: res.error,
                    type: "error",
                  });
                  return;
                }
                setReviewTarget(null);
                setReviewComment("");
                pushToast({
                  title: "Review published",
                  description: "Thank you for helping the GYD community.",
                  type: "success",
                });
              }}
            >
              Publish Review
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function CustomerBookingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <CustomerBookingsContent />
    </Suspense>
  );
}
