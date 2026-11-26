"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useGydStore } from "@/features/store/gyd-store";
import { formatDateShort } from "@/lib/utils";

export default function AdminSettingsPage() {
  const { pushToast } = useToast();
  const { state, updatePlatformSettings } = useGydStore();

  const [requireVerification, setRequireVerification] = useState(
    state.settings.requireDesignerVerification
  );
  const [depositPct, setDepositPct] = useState(
    String(state.settings.depositPercentage)
  );
  const [freeCancelHrs, setFreeCancelHrs] = useState(
    String(state.settings.cancellationFreeHours)
  );
  const [partialRefundPct, setPartialRefundPct] = useState(
    String(state.settings.partialRefundPercent)
  );
  const [emailEnabled, setEmailEnabled] = useState(
    state.settings.emailNotificationsEnabled
  );
  const [smsEnabled, setSmsEnabled] = useState(
    state.settings.smsNotificationsEnabled
  );
  const [terms, setTerms] = useState(state.settings.termsSummary);
  const [privacy, setPrivacy] = useState(state.settings.privacySummary);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlatformSettings({
      requireDesignerVerification: requireVerification,
      depositPercentage: Number(depositPct) || 30,
      cancellationFreeHours: Number(freeCancelHrs) || 48,
      partialRefundPercent: Number(partialRefundPct) || 50,
      emailNotificationsEnabled: emailEnabled,
      smsNotificationsEnabled: smsEnabled,
      termsSummary: terms,
      privacySummary: privacy,
    });
    pushToast({
      title: "Platform policies saved",
      type: "success",
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-text">
          Platform Settings & Audit Log
        </h1>
        <p className="text-sm text-brand-text-secondary">
          Configure verification gates, Razorpay deposit defaults, cancellation
          windows, and notification channels.
        </p>
      </div>

      <form onSubmit={handleSave} className="gyd-card p-6 space-y-5">
        <label className="flex items-start gap-3 rounded-2xl border border-brand-border bg-brand-bg p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={requireVerification}
            onChange={(e) => setRequireVerification(e.target.checked)}
            className="mt-1 accent-[var(--color-primary)]"
          />
          <div>
            <p className="text-sm font-bold text-brand-text">
              Require Admin Verification Before Public Listing
            </p>
            <p className="text-xs text-brand-text-secondary">
              Business rule: newly registered designers stay hidden from Explore &
              booking until approved.
            </p>
          </div>
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
              Booking Deposit (%)
            </label>
            <Input
              type="number"
              value={depositPct}
              onChange={(e) => setDepositPct(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
              Free Cancel Window (hrs)
            </label>
            <Input
              type="number"
              value={freeCancelHrs}
              onChange={(e) => setFreeCancelHrs(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
              Late Refund (%)
            </label>
            <Input
              type="number"
              value={partialRefundPct}
              onChange={(e) => setPartialRefundPct(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="accent-[var(--color-primary)]"
            />
            Resend Email Notifications
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={smsEnabled}
              onChange={(e) => setSmsEnabled(e.target.checked)}
              className="accent-[var(--color-primary)]"
            />
            SMS Reminders
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
            Terms Policy Summary
          </label>
          <Textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
            Privacy Policy Summary
          </label>
          <Textarea
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value)}
            rows={2}
          />
        </div>

        <Button type="submit" variant="primary">
          Save Platform Configuration
        </Button>
      </form>

      <section className="gyd-card p-6 space-y-4">
        <h2 className="font-editorial text-xl font-semibold text-brand-text">
          Admin Audit Trail
        </h2>
        <div className="space-y-2.5">
          {state.auditLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-brand-border bg-brand-bg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <span className="font-bold text-brand-primary">{log.action}</span>
                <span className="text-brand-muted-fg"> · {log.actorName}</span>
                <p className="text-brand-text-secondary mt-0.5">{log.details}</p>
              </div>
              <span className="text-brand-muted-fg shrink-0">
                {formatDateShort(log.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
