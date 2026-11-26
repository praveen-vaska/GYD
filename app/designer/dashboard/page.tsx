"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Clock,
  IndianRupee,
  Sparkles,
  Star,
} from "lucide-react";
import {
  ApprovalStatusBadge,
  BookingStatusBadge,
} from "@/components/common/status-badges";
import {
  EditorialBarChart,
  HorizontalDistributionChart,
} from "@/components/charts/gyd-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGydStore } from "@/features/store/gyd-store";
import { formatDateShort, formatINR } from "@/lib/utils";

export default function DesignerDashboardPage() {
  const { state } = useGydStore();
  const did = state.session?.designerId ?? "des-1";
  const designer =
    state.designers.find((d) => d.id === did) ?? state.designers[0];

  const myBookings = state.bookings.filter((b) => b.designerId === designer.id);
  const myServices = state.services.filter((s) => s.designerId === designer.id);
  const myCommissions = state.commissions.filter(
    (c) => c.designerId === designer.id
  );

  const upcomingCount = myBookings.filter((b) =>
    ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"].includes(b.status)
  ).length;
  const completedCount = myBookings.filter(
    (b) => b.status === "COMPLETED"
  ).length;
  const pendingCount = myBookings.filter((b) => b.status === "PENDING").length;
  const totalNetEarnings = myCommissions.reduce(
    (sum, c) => sum + c.netDesignerInr,
    0
  );

  const monthlyRevenueData = [
    { label: "Jul", value: 18500, secondaryValue: 4 },
    { label: "Aug", value: 24200, secondaryValue: 5 },
    { label: "Sep", value: 31800, secondaryValue: 7 },
    { label: "Oct", value: 28900, secondaryValue: 6 },
    { label: "Nov", value: Math.max(19500, totalNetEarnings), secondaryValue: myBookings.length },
  ];

  const servicePopularity = myServices.slice(0, 4).map((srv) => {
    const count = myBookings.filter((b) => b.serviceId === srv.id).length;
    return {
      label: srv.subcategoryName,
      value: Math.max(1, count),
      displayValue: count === 1 ? "1 booking" : `${count} bookings`,
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <ApprovalStatusBadge status={designer.approvalStatus} />
            <Badge tone="primary">{designer.city}</Badge>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-brand-text">
            {designer.name}’s Atelier Overview
          </h1>
          <p className="text-sm text-brand-text-secondary">
            {designer.title} · {designer.experienceYears} years experience
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/designers/${designer.id}`}>Public Profile</Link>
          </Button>
          <Button asChild variant="primary" size="sm">
            <Link href="/designer/bookings">
              Review Requests ({pendingCount})
            </Link>
          </Button>
        </div>
      </div>

      {designer.approvalStatus === "PENDING_REVIEW" && (
        <div className="rounded-2xl border border-brand-warning-border bg-brand-warning-bg p-4 flex items-start gap-3 text-xs sm:text-sm text-brand-warning">
          <BadgeCheck className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Verification Pending Admin Approval</p>
            <p className="mt-0.5">
              Your profile is currently hidden from public customer bookings while
              Admin reviews your credentials. You can prepare services and
              portfolio items now, or switch to the Admin Demo Portal to approve
              this studio.
            </p>
          </div>
        </div>
      )}

      {/* 6 KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            label: "Total Bookings",
            value: myBookings.length,
            icon: CalendarCheck,
          },
          {
            label: "Upcoming Appointments",
            value: upcomingCount,
            icon: Clock,
          },
          {
            label: "Completed Appointments",
            value: completedCount,
            icon: CheckCircle2,
          },
          {
            label: "Pending Requests",
            value: pendingCount,
            icon: Sparkles,
          },
          {
            label: "Net Earnings (After Fee)",
            value: formatINR(totalNetEarnings),
            icon: IndianRupee,
          },
          {
            label: "Average Rating",
            value: `${designer.rating.toFixed(1)} ★ (${designer.reviewCount})`,
            icon: Star,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="gyd-card p-5 flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-secondary text-brand-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted-fg">
                  {card.label}
                </p>
                <p className="font-editorial text-2xl font-semibold text-brand-text mt-0.5">
                  {card.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-7 gyd-card p-6 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-editorial text-xl font-semibold text-brand-text">
                Monthly Revenue & Booking Volume
              </h2>
              <p className="text-xs text-brand-muted-fg">
                Net designer revenue trend (Jul – Nov 2026)
              </p>
            </div>
            <Badge tone="primary">INR</Badge>
          </div>
          <EditorialBarChart data={monthlyRevenueData} formatAsCurrency />
        </section>

        <section className="lg:col-span-5 gyd-card p-6 space-y-4">
          <div>
            <h2 className="font-editorial text-xl font-semibold text-brand-text">
              Service Popularity
            </h2>
            <p className="text-xs text-brand-muted-fg">
              Distribution across your active offerings
            </p>
          </div>
          <HorizontalDistributionChart items={servicePopularity} />
        </section>
      </div>

      {/* Recent Bookings & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8 gyd-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-xl font-semibold text-brand-text">
              Recent Booking Pipeline
            </h2>
            <Link
              href="/designer/bookings"
              className="text-xs font-semibold text-brand-accent hover:underline"
            >
              Open full pipeline →
            </Link>
          </div>
          <div className="space-y-3">
            {myBookings.slice(0, 4).map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-brand-border bg-brand-bg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-brand-primary">
                      {b.bookingCode}
                    </span>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <p className="text-sm font-semibold text-brand-text">
                    {b.customerName} · {b.serviceTitle}
                  </p>
                  <p className="text-xs text-brand-muted-fg">
                    {formatDateShort(b.date)} · {b.startTime} · {b.city}
                  </p>
                </div>
                <span className="font-bold text-sm text-brand-text">
                  {formatINR(b.totalAmountInr)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <aside className="lg:col-span-4 gyd-card p-6 space-y-3">
          <h2 className="font-editorial text-xl font-semibold text-brand-text">
            Quick Studio Actions
          </h2>
          <Button asChild variant="primary" className="w-full justify-between">
            <Link href="/designer/services">
              <span>Add / Edit Services</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full justify-between">
            <Link href="/designer/portfolio">
              <span>Upload Portfolio Lookbook</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-between">
            <Link href="/designer/availability">
              <span>Configure Availability Slots</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-between">
            <Link href="/designer/earnings">
              <span>View Payout Settlements</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
