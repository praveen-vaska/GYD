"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Heart,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/common/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { useGydStore } from "@/features/store/gyd-store";
import { formatDateShort, formatINR } from "@/lib/utils";

export default function CustomerDashboardPage() {
  const { state } = useGydStore();
  const uid = state.session?.userId ?? "usr-cust-1";
  const myBookings = state.bookings.filter((b) => b.customerId === uid);
  const myFavourites = state.favourites.filter((f) => f.customerId === uid);

  const upcomingCount = myBookings.filter((b) =>
    ["PENDING", "ACCEPTED", "AWAITING_PAYMENT", "CONFIRMED", "IN_PROGRESS"].includes(
      b.status
    )
  ).length;
  const completedCount = myBookings.filter(
    (b) => b.status === "COMPLETED"
  ).length;
  const pendingCount = myBookings.filter((b) => b.status === "PENDING").length;

  const stats = [
    {
      label: "Total Bookings",
      value: myBookings.length,
      icon: CalendarCheck,
      tone: "text-brand-primary bg-brand-secondary",
    },
    {
      label: "Upcoming Appointments",
      value: upcomingCount,
      icon: Clock,
      tone: "text-brand-accent bg-brand-highlight",
    },
    {
      label: "Completed Services",
      value: completedCount,
      icon: CheckCircle2,
      tone: "text-brand-success bg-brand-success-bg",
    },
    {
      label: "Pending Requests",
      value: pendingCount,
      icon: Sparkles,
      tone: "text-brand-warning bg-brand-warning-bg",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Badge tone="primary">Client Workspace</Badge>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-brand-text mt-2">
            Welcome back, {state.session?.name.split(" ")[0] ?? "Ananya"}
          </h1>
          <p className="text-sm text-brand-text-secondary mt-1">
            Track your upcoming styling sessions, saved designers, and studio
            messages.
          </p>
        </div>
        <Button asChild variant="primary" size="md">
          <Link href="/explore">
            Book New Designer
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="gyd-card p-5 flex items-center gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${s.tone}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  {s.label}
                </p>
                <p className="font-editorial text-3xl font-semibold text-brand-text mt-0.5">
                  {s.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Recent Bookings */}
        <section className="lg:col-span-8 gyd-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-xl font-semibold text-brand-text">
              Recent & Upcoming Appointments
            </h2>
            <Link
              href="/customer/bookings"
              className="text-xs font-semibold text-brand-accent hover:underline"
            >
              Manage all bookings →
            </Link>
          </div>

          {myBookings.length === 0 ? (
            <EmptyState
              title="No bookings yet"
              description="Discover verified stylists, makeup artists, and decorators to schedule your first consultation."
              actionLabel="Find My Designer"
              onAction={() => {}}
            />
          ) : (
            <div className="space-y-3">
              {myBookings.slice(0, 4).map((bkg) => (
                <div
                  key={bkg.id}
                  className="rounded-2xl border border-brand-border bg-brand-bg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-brand-primary">
                        {bkg.bookingCode}
                      </span>
                      <BookingStatusBadge status={bkg.status} />
                      <PaymentStatusBadge status={bkg.paymentStatus} />
                    </div>
                    <p className="font-semibold text-sm text-brand-text">
                      {bkg.serviceTitle} with {bkg.designerName}
                    </p>
                    <p className="text-xs text-brand-muted-fg">
                      {formatDateShort(bkg.date)} · {bkg.startTime} · {bkg.city}
                    </p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                    <span className="font-bold text-sm text-brand-text">
                      {formatINR(bkg.totalAmountInr)}
                    </span>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/customer/bookings">Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Shortcuts */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="gyd-card p-5 space-y-4">
            <h2 className="font-editorial text-xl font-semibold text-brand-text">
              Quick Actions
            </h2>
            <div className="space-y-2.5">
              <Button asChild variant="secondary" className="w-full justify-between">
                <Link href="/customer/favourites">
                  <span className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-brand-accent" />
                    Saved Wishlist ({myFavourites.length})
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" className="w-full justify-between">
                <Link href="/customer/messages">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-brand-primary" />
                    Open Messages
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/customer/profile">
                  <span>Manage Saved Addresses</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="gyd-card p-5 bg-brand-secondary/50 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">
              Seasonal Offer Code
            </p>
            <p className="font-editorial text-xl font-semibold text-brand-text">
              GYDWELCOME
            </p>
            <p className="text-xs text-brand-text-secondary">
              Save 10% (up to ₹750) on personal & wedding styling consultations
              above ₹1,499.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
