"use client";

import React from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Database,
  IndianRupee,
  Percent,
  Users,
  XCircle,
} from "lucide-react";
import {
  EditorialBarChart,
  HorizontalDistributionChart,
} from "@/components/charts/gyd-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGydStore } from "@/features/store/gyd-store";
import { formatDateShort, formatINR } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { state, dbSource, dbStatus } = useGydStore();

  const totalCustomers = state.users.filter((u) => u.role === "CUSTOMER").length;
  const totalDesigners = state.designers.length;
  const pendingApprovals = state.designers.filter(
    (d) => d.approvalStatus === "PENDING_REVIEW"
  ).length;
  const totalBookings = state.bookings.length;
  const activeBookings = state.bookings.filter((b) =>
    ["PENDING", "ACCEPTED", "AWAITING_PAYMENT", "CONFIRMED", "IN_PROGRESS"].includes(
      b.status
    )
  ).length;
  const completedBookings = state.bookings.filter(
    (b) => b.status === "COMPLETED"
  ).length;
  const cancelledBookings = state.bookings.filter(
    (b) => b.status === "CANCELLED" || b.status === "REJECTED"
  ).length;
  const totalRevenue = state.bookings
    .filter((b) => !["CANCELLED", "REJECTED", "REFUNDED"].includes(b.status))
    .reduce((sum, b) => sum + b.totalAmountInr, 0);
  const platformCommission = state.commissions.reduce(
    (sum, c) => sum + c.platformFeeInr,
    0
  );

  const revenueTrend = [
    { label: "Jul", value: 48200, secondaryValue: 12000 },
    { label: "Aug", value: 64900, secondaryValue: 16400 },
    { label: "Sep", value: 79400, secondaryValue: 21500 },
    { label: "Oct", value: 88200, secondaryValue: 24900 },
    { label: "Nov", value: totalRevenue, secondaryValue: platformCommission },
  ];

  const categoryPerf = state.categories
    .slice(0, 6)
    .map((cat) => {
      const count = state.bookings.filter((b) => b.categoryId === cat.id).length;
      return {
        label: cat.name,
        value: Math.max(1, count),
        displayValue: count === 1 ? "1 booking" : `${count} bookings`,
      };
    });

  const topDesigners = [...state.designers]
    .sort((a, b) => b.completedProjectsCount - a.completedProjectsCount)
    .slice(0, 5)
    .map((d) => ({
      label: `${d.name} (${d.city})`,
      value: d.completedProjectsCount,
      displayValue: `${d.completedProjectsCount} projects · ${d.rating}★`,
    }));

  const kpis = [
    { label: "Total Customers", value: totalCustomers, icon: Users },
    { label: "Total Designers", value: totalDesigners, icon: BadgeCheck },
    { label: "Pending Approvals", value: pendingApprovals, icon: Clock },
    { label: "Total Bookings", value: totalBookings, icon: CalendarCheck },
    { label: "Active Bookings", value: activeBookings, icon: CalendarCheck },
    { label: "Completed Bookings", value: completedBookings, icon: CheckCircle2 },
    { label: "Cancelled / Declined", value: cancelledBookings, icon: XCircle },
    { label: "Gross Marketplace GMV", value: formatINR(totalRevenue), icon: IndianRupee },
    { label: "Platform Commission", value: formatINR(platformCommission), icon: Percent },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">Executive Operations</Badge>
            <Badge tone={dbSource === "mongodb" ? "success" : "warning"}>
              <Database className="h-3 w-3 mr-1" />
              {dbSource === "mongodb"
                ? "MongoDB Atlas Connected"
                : dbStatus === "needs_password"
                  ? "Local Fallback · Add Atlas Password"
                  : "Local Fallback Mode"}
            </Badge>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-brand-text mt-2">
            GYD Platform Control Center
          </h1>
          <p className="text-sm text-brand-text-secondary mt-1">
            Monitor marketplace volume, designer verifications, commission health,
            and customer bookings.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="accent" size="sm">
            <Link href="/admin/designers">
              Review Pending Designers ({pendingApprovals})
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/categories">Manage Categories</Link>
          </Button>
        </div>
      </div>

      {/* 9 KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="gyd-card p-5 flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-secondary text-brand-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted-fg">
                  {kpi.label}
                </p>
                <p className="font-editorial text-2xl font-semibold text-brand-text mt-0.5">
                  {kpi.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-7 gyd-card p-6 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-editorial text-xl font-semibold text-brand-text">
                Revenue & Commission Overview
              </h2>
              <p className="text-xs text-brand-muted-fg">
                Deep Plum = Gross GMV · Coral = Platform Commission
              </p>
            </div>
            <Badge tone="primary">INR</Badge>
          </div>
          <EditorialBarChart data={revenueTrend} formatAsCurrency />
        </section>

        <section className="lg:col-span-5 gyd-card p-6 space-y-4">
          <h2 className="font-editorial text-xl font-semibold text-brand-text">
            Category Performance
          </h2>
          <HorizontalDistributionChart items={categoryPerf} />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-6 gyd-card p-6 space-y-4">
          <h2 className="font-editorial text-xl font-semibold text-brand-text">
            Top Designer Leaderboard
          </h2>
          <HorizontalDistributionChart items={topDesigners} />
        </section>

        <section className="lg:col-span-6 gyd-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-xl font-semibold text-brand-text">
              Recent Admin Audit Log
            </h2>
            <Link
              href="/admin/settings"
              className="text-xs font-semibold text-brand-accent hover:underline"
            >
              All logs →
            </Link>
          </div>
          <div className="space-y-3">
            {state.auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-brand-border bg-brand-bg p-3 text-xs space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-primary">
                    {log.action}
                  </span>
                  <span className="text-brand-muted-fg">
                    {formatDateShort(log.createdAt)}
                  </span>
                </div>
                <p className="text-brand-text-secondary">{log.details}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
