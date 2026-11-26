"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Eye, ShieldAlert, Star, Trash2, X } from "lucide-react";
import { ApprovalStatusBadge } from "@/components/common/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useGydStore } from "@/features/store/gyd-store";
import { formatDateShort, formatINR } from "@/lib/utils";
import { DesignerProfile } from "@/types";

export default function AdminDesignersPage() {
  const { pushToast } = useToast();
  const {
    state,
    updateDesignerApproval,
    removeDesigner,
    toggleDesignerFeatured,
  } = useGydStore();

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [inspectDesigner, setInspectDesigner] =
    useState<DesignerProfile | null>(null);
  const [confirmRemove, setConfirmRemove] =
    useState<DesignerProfile | null>(null);

  const filtered = state.designers
    .filter((d) => {
      if (filter !== "ALL" && d.approvalStatus !== filter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const priority = (s: DesignerProfile["approvalStatus"]) =>
        s === "PENDING_REVIEW" ? 0 : s === "APPROVED" ? 1 : 2;
      return priority(a.approvalStatus) - priority(b.approvalStatus);
    });

  const verificationRecord = inspectDesigner
    ? state.verifications.find((v) => v.designerId === inspectDesigner.id)
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-text">
          Designer Management & Approvals
        </h1>
        <p className="text-sm text-brand-text-secondary">
          Review onboarding credentials, approve or reject applications, toggle
          featured homepage placement, and audit designer performance.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          {["ALL", "PENDING_REVIEW", "APPROVED", "SUSPENDED", "REJECTED"].map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilter(st)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                  filter === st
                    ? "bg-brand-primary text-brand-primary-fg"
                    : "bg-brand-surface border border-brand-border text-brand-text-secondary"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            )
          )}
        </div>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search designer or city..."
          className="sm:w-64"
        />
      </div>

      <div className="space-y-4">
        {filtered.map((des) => (
          <article key={des.id} className="gyd-card p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <ApprovalStatusBadge status={des.approvalStatus} />
                  {des.isFeatured && <Badge tone="accent">Featured on Home</Badge>}
                  <Badge tone="primary">{des.city}</Badge>
                </div>
                <h2 className="font-editorial text-xl font-semibold text-brand-text">
                  {des.name} · <span className="text-base font-sans font-medium text-brand-text-secondary">{des.title}</span>
                </h2>
                <p className="text-xs text-brand-muted-fg">
                  {des.experienceYears} yrs exp · Starting {formatINR(des.startingPriceInr)} ·{" "}
                  {des.rating.toFixed(1)}★ ({des.reviewCount} reviews) ·{" "}
                  {des.completedProjectsCount} projects
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInspectDesigner(des)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Verify Docs
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/designers/${des.id}`}>Portfolio</Link>
                </Button>

                {des.approvalStatus !== "APPROVED" && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      updateDesignerApproval(
                        des.id,
                        "APPROVED",
                        "Verified by GYD Admin Team."
                      );
                      pushToast({
                        title: `${des.name} approved`,
                        description: "Now visible and bookable on GYD.",
                        type: "success",
                      });
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                )}

                {des.approvalStatus === "PENDING_REVIEW" && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      updateDesignerApproval(
                        des.id,
                        "REJECTED",
                        "Portfolio or credential verification incomplete."
                      );
                      pushToast({
                        title: `${des.name} rejected`,
                        type: "info",
                      });
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                )}

                {des.approvalStatus === "APPROVED" && (
                  <>
                    <Button
                      size="sm"
                      variant={des.isFeatured ? "accent" : "outline"}
                      onClick={() => toggleDesignerFeatured(des.id)}
                    >
                      <Star className="h-3.5 w-3.5" />
                      {des.isFeatured ? "Featured" : "Feature"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-brand-error"
                      onClick={() => {
                        updateDesignerApproval(
                          des.id,
                          "SUSPENDED",
                          "Temporarily blocked & hidden by Admin moderation."
                        );
                        pushToast({
                          title: `${des.name} blocked`,
                          description:
                            "Studio removed from public listings, bookings, and login.",
                          type: "warning",
                        });
                      }}
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Block
                    </Button>
                  </>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-brand-error"
                  onClick={() => setConfirmRemove(des)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Modal
        open={Boolean(confirmRemove)}
        onClose={() => setConfirmRemove(null)}
        title={`Remove ${confirmRemove?.name ?? "Designer"}?`}
        description="This permanently deletes their designer profile, services, portfolio, availability, and studio access across the entire website."
      >
        {confirmRemove && (
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRemove(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                const res = removeDesigner(confirmRemove.id);
                if (res.ok) {
                  pushToast({
                    title: `${confirmRemove.name} removed permanently`,
                    description:
                      "Deleted from website listings, search, portfolios, and login.",
                    type: "info",
                  });
                }
                setConfirmRemove(null);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Confirm Remove
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(inspectDesigner)}
        onClose={() => setInspectDesigner(null)}
        title={`Verification Review · ${inspectDesigner?.name ?? ""}`}
        description="Restricted Admin Compliance Inspection"
      >
        {inspectDesigner && (
          <div className="space-y-4 text-sm">
            <p>
              <strong>Categories:</strong>{" "}
              {inspectDesigner.categoryNames.join(", ")}
            </p>
            <p>
              <strong>Bio:</strong> {inspectDesigner.bio}
            </p>
            <div className="rounded-xl border border-brand-border bg-brand-bg p-4 space-y-1.5 text-xs">
              <p className="font-bold text-brand-primary uppercase">
                Submitted Verification Credential
              </p>
              <p>
                Document Type:{" "}
                {verificationRecord?.documentType ?? "Portfolio Credential"}
              </p>
              <p>
                Masked ID:{" "}
                {verificationRecord?.documentRefMasked ?? "GYD-VER-CONFIRMED"}
              </p>
              <p>
                Submitted:{" "}
                {verificationRecord
                  ? formatDateShort(verificationRecord.submittedAt)
                  : "Verified Onboard"}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
