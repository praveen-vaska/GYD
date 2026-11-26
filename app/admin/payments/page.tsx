"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { PaymentStatusBadge } from "@/components/common/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useGydStore } from "@/features/store/gyd-store";
import { formatINR } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const { pushToast } = useToast();
  const { state, processRefundDemo } = useGydStore();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-text">
          Payments & Refund Moderation
        </h1>
        <p className="text-sm text-brand-text-secondary">
          Monitor Razorpay Sandbox orders and process customer refund requests
          under platform cancellation rules.
        </p>
      </div>

      {/* Refund Queue */}
      <section className="gyd-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-xl font-semibold text-brand-text">
            Refund Requests ({state.refunds.length})
          </h2>
          <Badge tone="info">Razorpay Sandbox Mode</Badge>
        </div>

        <div className="space-y-3">
          {state.refunds.map((ref) => (
            <div
              key={ref.id}
              className="rounded-2xl border border-brand-border bg-brand-bg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge tone="primary">{ref.bookingCode}</Badge>
                  <Badge
                    tone={
                      ref.status === "PROCESSED_DEMO"
                        ? "success"
                        : ref.status === "REJECTED"
                          ? "error"
                          : "warning"
                    }
                  >
                    {ref.status}
                  </Badge>
                </div>
                <p className="font-semibold text-sm text-brand-text">
                  {ref.customerName} · Refund Amount: {formatINR(ref.amountInr)}
                </p>
                <p className="text-xs text-brand-text-secondary">{ref.reason}</p>
              </div>
              {ref.status === "REQUESTED" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      processRefundDemo(ref.id, "PROCESSED_DEMO");
                      pushToast({
                        title: "Demo refund processed",
                        description: `${ref.bookingCode} marked refunded in sandbox ledger.`,
                        type: "success",
                      });
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve & Process (Demo)
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-brand-error"
                    onClick={() => processRefundDemo(ref.id, "REJECTED")}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Payments Ledger */}
      <section className="gyd-card p-6 space-y-4">
        <h2 className="font-editorial text-xl font-semibold text-brand-text">
          Transaction Ledger ({state.payments.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[680px]">
            <thead className="border-b border-brand-border text-xs uppercase text-brand-muted-fg">
              <tr>
                <th className="py-3 pr-3">Booking</th>
                <th className="py-3 pr-3">Gateway Order ID</th>
                <th className="py-3 pr-3">Client → Designer</th>
                <th className="py-3 pr-3">Mode</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {state.payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 pr-3 font-bold text-brand-primary">
                    {p.bookingCode}
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs text-brand-muted-fg">
                    {p.gatewayOrderId}
                  </td>
                  <td className="py-3 pr-3">
                    {p.customerName} → {p.designerName}
                  </td>
                  <td className="py-3 pr-3 text-xs">{p.paymentMode}</td>
                  <td className="py-3 pr-3">
                    <PaymentStatusBadge status={p.status} />
                  </td>
                  <td className="py-3 text-right font-bold">
                    {formatINR(p.amountInr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
