"use client";

import React from "react";
import { Eye, EyeOff, Flag, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useGydStore } from "@/features/store/gyd-store";
import { formatDateShort } from "@/lib/utils";

export default function AdminReviewsPage() {
  const { pushToast } = useToast();
  const { state, moderateReview } = useGydStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-text">
          Reviews & Trust Moderation
        </h1>
        <p className="text-sm text-brand-text-secondary">
          Monitor customer ratings, flag disputes, or hide inappropriate
          submissions.
        </p>
      </div>

      <div className="space-y-4">
        {state.reviews.map((rev) => (
          <article key={rev.id} className="gyd-card p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm text-brand-text">
                  {rev.customerName} → {rev.designerName}
                </span>
                <Badge tone="accent">
                  <Star className="h-3 w-3 fill-current" />
                  {rev.rating}
                </Badge>
                {rev.isDemoSample && <Badge tone="neutral">Demo Sample</Badge>}
                <Badge
                  tone={
                    rev.moderationStatus === "PUBLISHED"
                      ? "success"
                      : rev.moderationStatus === "FLAGGED"
                        ? "warning"
                        : "error"
                  }
                >
                  {rev.moderationStatus}
                </Badge>
              </div>
              <span className="text-xs text-brand-muted-fg">
                {formatDateShort(rev.createdAt)}
              </span>
            </div>

            <p className="text-xs text-brand-muted-fg">{rev.serviceTitle}</p>
            <p className="text-sm text-brand-text-secondary">{rev.comment}</p>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-border">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  moderateReview(rev.id, "PUBLISHED");
                  pushToast({ title: "Review published", type: "success" });
                }}
              >
                <Eye className="h-3.5 w-3.5" />
                Publish
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  moderateReview(rev.id, "FLAGGED");
                  pushToast({ title: "Review flagged for investigation", type: "warning" });
                }}
              >
                <Flag className="h-3.5 w-3.5" />
                Flag
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-brand-error"
                onClick={() => {
                  moderateReview(rev.id, "HIDDEN");
                  pushToast({ title: "Review hidden from public", type: "info" });
                }}
              >
                <EyeOff className="h-3.5 w-3.5" />
                Hide
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
