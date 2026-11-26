"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  CalendarRange,
  CreditCard,
  FileEdit,
  Layers,
  LayoutDashboard,
  MessageSquareWarning,
  Percent,
  Settings,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useGydStore } from "@/features/store/gyd-store";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { state } = useGydStore();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const pendingApprovals = state.designers.filter(
    (d) => d.approvalStatus === "PENDING_REVIEW"
  ).length;
  const openRefunds = state.refunds.filter(
    (r) => r.status === "REQUESTED"
  ).length;

  return (
    <DashboardShell
      portalTitle="Admin Console"
      portalSubtitle="Platform Operations"
      role="ADMIN"
      navItems={[
        { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/admin/users", label: "Customers", icon: Users },
        {
          href: "/admin/designers",
          label: "Designers & Approvals",
          icon: BadgeCheck,
          badgeCount: pendingApprovals,
        },
        { href: "/admin/categories", label: "Categories", icon: Layers },
        { href: "/admin/bookings", label: "All Bookings", icon: CalendarRange },
        {
          href: "/admin/payments",
          label: "Payments & Refunds",
          icon: CreditCard,
          badgeCount: openRefunds,
        },
        { href: "/admin/commissions", label: "Commissions & Payouts", icon: Percent },
        { href: "/admin/reviews", label: "Reviews & Moderation", icon: MessageSquareWarning },
        { href: "/admin/cms", label: "CMS & Content", icon: FileEdit },
        { href: "/admin/settings", label: "Platform Settings", icon: Settings },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
