import React from "react";
import { Badge } from "@/components/ui/badge";
import { BOOKING_STATUS_META } from "@/constants/gyd";
import {
  AccountStatus,
  BookingStatus,
  DesignerApprovalStatus,
  PaymentStatus,
} from "@/types";

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const meta = BOOKING_STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const map: Record<
    PaymentStatus,
    { label: string; tone: "neutral" | "info" | "success" | "warning" | "error" }
  > = {
    UNPAID: { label: "Payment Pending", tone: "warning" },
    DEPOSIT_INITIATED: { label: "Deposit Initiated (Demo)", tone: "info" },
    DEPOSIT_PAID_DEMO: { label: "30% Deposit Paid (Demo)", tone: "info" },
    PAID_DEMO: { label: "Paid (Sandbox Demo)", tone: "success" },
    REFUND_PENDING: { label: "Refund Pending", tone: "warning" },
    REFUNDED_DEMO: { label: "Refunded (Demo)", tone: "neutral" },
    FAILED: { label: "Payment Failed", tone: "error" },
  };
  const meta = map[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function ApprovalStatusBadge({ status }: { status: DesignerApprovalStatus }) {
  const map: Record<
    DesignerApprovalStatus,
    { label: string; tone: "neutral" | "info" | "success" | "warning" | "error" }
  > = {
    PENDING_REVIEW: { label: "Pending Verification", tone: "warning" },
    APPROVED: { label: "Verified & Approved", tone: "success" },
    REJECTED: { label: "Rejected", tone: "error" },
    SUSPENDED: { label: "Suspended", tone: "error" },
  };
  const meta = map[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const tone =
    status === "ACTIVE" ? "success" : status === "INACTIVE" ? "neutral" : "error";
  return <Badge tone={tone}>{status}</Badge>;
}
