"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { useGydStore } from "@/features/store/gyd-store";
import { formatDateShort, formatINR } from "@/lib/utils";

export default function DesignerEarningsPage() {
  const { state } = useGydStore();
  const did = state.session?.designerId ?? "des-1";
  const myCommissions = state.commissions.filter((c) => c.designerId === did);
  const myPayouts = state.payouts.filter((p) => p.designerId === did);

  const gross = myCommissions.reduce((s, c) => s + c.grossAmountInr, 0);
  const commission = myCommissions.reduce((s, c) => s + c.platformFeeInr, 0);
  const net = myCommissions.reduce((s, c) => s + c.netDesignerInr, 0);
  const pendingSettlement = myPayouts
    .filter((p) => p.status === "PENDING_SETTLEMENT")
    .reduce((s, p) => s + p.amountInr, 0);
  const completedPayouts = myPayouts
    .filter((p) => p.status === "PAID_DEMO")
    .reduce((s, p) => s + p.amountInr, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-text">
          Earnings & Payout Ledger
        </h1>
        <p className="text-sm text-brand-text-secondary">
          Transparent breakdown of gross bookings, platform commission, net
          earnings, and settlement cycles (demo ledger).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Gross Earnings", formatINR(gross)],
          ["Platform Commission", formatINR(commission)],
          ["Net Earnings", formatINR(net)],
          ["Pending Settlements", formatINR(pendingSettlement)],
          ["Completed Payouts (Demo)", formatINR(completedPayouts)],
        ].map(([label, val]) => (
          <div key={label} className="gyd-card p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted-fg">
              {label}
            </p>
            <p className="font-editorial text-2xl font-semibold text-brand-text mt-1">
              {val}
            </p>
          </div>
        ))}
      </div>

      <section className="gyd-card p-6 space-y-4">
        <h2 className="font-editorial text-xl font-semibold text-brand-text">
          Commission & Transaction History
        </h2>
        {myCommissions.length === 0 ? (
          <EmptyState
            title="No completed transactions yet"
            description="Completed bookings generate transparent commission & payout records here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-border text-xs uppercase text-brand-muted-fg">
                <tr>
                  <th className="py-3 pr-4">Booking</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Gross</th>
                  <th className="py-3 pr-4">Platform Fee</th>
                  <th className="py-3 pr-4">Net Payable</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {myCommissions.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 pr-4 font-semibold text-brand-primary">
                      {c.bookingCode}
                    </td>
                    <td className="py-3 pr-4">{c.categoryName}</td>
                    <td className="py-3 pr-4">{formatINR(c.grossAmountInr)}</td>
                    <td className="py-3 pr-4 text-brand-muted-fg">
                      {formatINR(c.platformFeeInr)} ({c.commissionRatePercent}%)
                    </td>
                    <td className="py-3 pr-4 font-bold text-brand-text">
                      {formatINR(c.netDesignerInr)}
                    </td>
                    <td className="py-3">
                      <Badge tone={c.settled ? "success" : "warning"}>
                        {c.settled ? "Settled" : "Pending"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="gyd-card p-6 space-y-4">
        <h2 className="font-editorial text-xl font-semibold text-brand-text">
          Payout Batches (RazorpayX / Bank Settlement Architecture)
        </h2>
        <div className="space-y-3">
          {myPayouts.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-brand-border bg-brand-bg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <p className="font-semibold text-sm text-brand-text">
                  {p.periodLabel} · Ref: {p.referenceCode}
                </p>
                <p className="text-xs text-brand-muted-fg">
                  {p.paidAt ? `Paid ${formatDateShort(p.paidAt)}` : "Scheduled for settlement"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-brand-text">
                  {formatINR(p.amountInr)}
                </span>
                <Badge tone={p.status === "PAID_DEMO" ? "success" : "warning"}>
                  {p.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
