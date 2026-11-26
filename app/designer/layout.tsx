"use client";

import React from "react";
import {
  Briefcase,
  CalendarDays,
  ClipboardList,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Wallet,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useGydStore } from "@/features/store/gyd-store";

export default function DesignerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state } = useGydStore();
  const did = state.session?.designerId ?? "des-1";
  const pendingBookings = state.bookings.filter(
    (b) => b.designerId === did && b.status === "PENDING"
  ).length;
  const unreadMsgs = state.conversations
    .filter((c) => c.designerId === did)
    .reduce((acc, c) => acc + c.unreadCountDesigner, 0);

  return (
    <DashboardShell
      portalTitle="Designer Studio"
      portalSubtitle="Partner Atelier"
      role="DESIGNER"
      navItems={[
        { href: "/designer/dashboard", label: "Studio Overview", icon: LayoutDashboard },
        {
          href: "/designer/bookings",
          label: "Booking Requests",
          icon: ClipboardList,
          badgeCount: pendingBookings,
        },
        { href: "/designer/services", label: "My Services", icon: Briefcase },
        { href: "/designer/portfolio", label: "Portfolio Gallery", icon: ImageIcon },
        { href: "/designer/availability", label: "Availability Calendar", icon: CalendarDays },
        { href: "/designer/earnings", label: "Earnings & Payouts", icon: Wallet },
        {
          href: "/designer/messages",
          label: "Client Messages",
          icon: MessageSquare,
          badgeCount: unreadMsgs,
        },
        { href: "/designer/settings", label: "Studio Settings", icon: Settings },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
