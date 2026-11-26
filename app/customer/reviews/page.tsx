"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useGydStore } from "@/features/store/gyd-store";
import { formatDateShort } from "@/lib/utils";

export default function CustomerReviewsPage() {
  const { state, submitReview } = useGydStore();
  const { pushToast } = useToast();
  const uid = state.session?.userId ?? "usr-cust-1";

  const myReviews = state.reviews.filter((r) => r.customerId === uid);
  const eligibleBookings = state.bookings.filter(
    (b) =>
      b.customerId === uid &&
      b.status === "COMPLETED" &&
      !state.reviews.some((r) => r.bookingId === b.id)
  );

  const [selectedBookingId, setSelectedBookingId] = useState(
    eligibleBookings[0]?.id ?? ""
  );
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) return;
    const res = submitReview(selectedBookingId, rating, comment);
    if (!res.ok) {
      pushToast({
        title: "Cannot publish review",
        description: res.error,
        type: "error",
      });
      return;
    }
    setComment("");
    pushToast({
      title: "Review submitted",
      description: "Thank you for sharing verified feedback.",
      type: "success",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-text">
          My Reviews
        </h1>
        <p className="text-sm text-brand-text-secondary">
          Reviews are permitted exclusively for eligible completed bookings.
        </p>
      </div>

      {eligibleBookings.length > 0 && (
        <form onSubmit={handleSubmit} className="gyd-panel p-6 space-y-4">
          <h2 className="font-editorial text-xl font-semibold text-brand-text">
            Write a Review for a Completed Service
          </h2>
          <select
            value={selectedBookingId}
            onChange={(e) => setSelectedBookingId(e.target.value)}
            className="w-full rounded-xl border border-brand-border-strong bg-brand-surface px-3.5 py-2.5 text-sm text-brand-text"
          >
            {eligibleBookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bookingCode} · {b.serviceTitle} ({b.designerName})
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="cursor-pointer"
              >
                <Star
                  className={`h-6 w-6 ${
                    n <= rating
                      ? "fill-brand-accent text-brand-accent"
                      : "text-brand-muted"
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
          />
          <Button type="submit" variant="primary">
            Submit Review
          </Button>
        </form>
      )}

      <div className="space-y-3">
        <h2 className="font-editorial text-xl font-semibold text-brand-text">
          Submitted Reviews ({myReviews.length})
        </h2>
        {myReviews.length === 0 ? (
          <EmptyState
            title="No reviews submitted yet"
            description="Complete a booked appointment to leave a verified review."
          />
        ) : (
          myReviews.map((r) => (
            <div key={r.id} className="gyd-card p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-brand-text">
                  {r.designerName} · {r.serviceTitle}
                </span>
                <div className="flex items-center gap-2">
                  {r.isDemoSample && <Badge tone="neutral">Demo Sample</Badge>}
                  <Badge tone="accent">{r.rating} ★</Badge>
                </div>
              </div>
              <p className="text-sm text-brand-text-secondary">{r.comment}</p>
              <p className="text-xs text-brand-muted-fg">
                {formatDateShort(r.createdAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
