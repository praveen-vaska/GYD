"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useGydStore } from "@/features/store/gyd-store";
import { formatINR } from "@/lib/utils";

export default function AdminCommissionsPage() {
  const { pushToast } = useToast();
  const {
    state,
    updatePlatformSettings,
    setDesignerCommissionOverride,
    markPayoutPaidDemo,
  } = useGydStore();

  const [defaultRate, setDefaultRate] = useState(
    String(state.settings.defaultCommissionPercent)
  );
  const [selectedDesignerId, setSelectedDesignerId] = useState(
    state.designers[0]?.id ?? "des-1"
  );
  const [overrideRate, setOverrideRate] = useState("");

  const totalPlatformFee = state.commissions.reduce(
    (s, c) => s + c.platformFeeInr,
    0
  );
  const totalDesignerNet = state.commissions.reduce(
    (s, c) => s + c.netDesignerInr,
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-text">
          Commission & Payout Controls
        </h1>
        <p className="text-sm text-brand-text-secondary">
          Configure global and designer-specific commission percentages, inspect
          platform vs studio earnings, and settle payout batches.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="gyd-card p-5">
          <p className="text-xs font-bold uppercase text-brand-muted-fg">
            Default Platform Rate
          </p>
          <p className="font-editorial text-3xl font-semibold text-brand-text mt-1">
            {state.settings.defaultCommissionPercent}%
          </p>
        </div>
        <div className="gyd-card p-5">
          <p className="text-xs font-bold uppercase text-brand-muted-fg">
            Platform Commission Earned
          </p>
          <p className="font-editorial text-3xl font-semibold text-brand-primary mt-1">
            {formatINR(totalPlatformFee)}
          </p>
        </div>
        <div className="gyd-card p-5">
          <p className="text-xs font-bold uppercase text-brand-muted-fg">
            Designer Net Earnings
          </p>
          <p className="font-editorial text-3xl font-semibold text-brand-accent mt-1">
            {formatINR(totalDesignerNet)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="gyd-card p-6 space-y-4">
          <h2 className="font-editorial text-xl font-semibold text-brand-text">
            Default Marketplace Commission
          </h2>
          <div className="flex gap-3">
            <Input
              type="number"
              min={1}
              max={40}
              value={defaultRate}
              onChange={(e) => setDefaultRate(e.target.value)}
            />
            <Button
              variant="primary"
              onClick={() => {
                updatePlatformSettings({
                  defaultCommissionPercent: Number(defaultRate) || 15,
                });
                pushToast({
                  title: "Default commission updated",
                  type: "success",
                });
              }}
            >
              Update %
            </Button>
          </div>
          <p className="text-xs text-brand-text-secondary">
            Category-specific overrides can be edited directly in Categories.
          </p>
        </div>

        <div className="gyd-card p-6 space-y-4">
          <h2 className="font-editorial text-xl font-semibold text-brand-text">
            Designer-Specific Commission Override
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Select
              value={selectedDesignerId}
              onChange={(e) => setSelectedDesignerId(e.target.value)}
              className="sm:col-span-2"
            >
              {state.designers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} (
                  {typeof d.commissionOverridePercent === "number"
                    ? `${d.commissionOverridePercent}%`
                    : "Default"}
                  )
                </option>
              ))}
            </Select>
            <Input
              type="number"
              placeholder="% or blank"
              value={overrideRate}
              onChange={(e) => setOverrideRate(e.target.value)}
            />
          </div>
          <Button
            variant="accent"
            onClick={() => {
              setDesignerCommissionOverride(
                selectedDesignerId,
                overrideRate ? Number(overrideRate) : undefined
              );
              pushToast({
                title: "Designer commission updated",
                type: "success",
              });
            }}
          >
            Apply Override
          </Button>
        </div>
      </div>

      <section className="gyd-card p-6 space-y-4">
        <h2 className="font-editorial text-xl font-semibold text-brand-text">
          Designer Payout Settlements (Demo)
        </h2>
        <div className="space-y-3">
          {state.payouts.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-brand-border bg-brand-bg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="font-semibold text-sm text-brand-text">
                  {p.designerName} · {p.periodLabel}
                </p>
                <p className="text-xs text-brand-muted-fg font-mono">
                  {p.referenceCode}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-brand-text">
                  {formatINR(p.amountInr)}
                </span>
                <Badge tone={p.status === "PAID_DEMO" ? "success" : "warning"}>
                  {p.status}
                </Badge>
                {p.status === "PENDING_SETTLEMENT" && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      markPayoutPaidDemo(p.id);
                      pushToast({
                        title: "Demo payout settled",
                        description: `${formatINR(p.amountInr)} marked paid to ${p.designerName}.`,
                        type: "success",
                      });
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark Paid (Demo)
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
