"use client";

import React from "react";
import {
  Bell,
  CalendarCheck,
  Heart,
  History,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Star,
  UserCircle2,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useGydStore } from "@/features/store/gyd-store";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state } = useGydStore();
  const uid = state.session?.userId ?? "usr-cust-1";
  const unreadMsgs = state.conversations
    .filter((c) => c.customerId === uid)
    .reduce((acc, c) => acc + c.unreadCountCustomer, 0);
  const unreadNotifs = state.notifications.filter(
    (n) => n.role === "CUSTOMER" && !n.isRead
  ).length;

  return (
    <DashboardShell
      portalTitle="Customer Dashboard"
      portalSubtitle="Client Portal"
      role="CUSTOMER"
      navItems={[
        { href: "/customer/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/customer/bookings", label: "My Bookings", icon: CalendarCheck },
        { href: "/customer/bookings?tab=history", label: "Booking History", icon: History },
        { href: "/customer/favourites", label: "Favourite Designers", icon: Heart },
        {
          href: "/customer/messages",
          label: "Messages",
          icon: MessageSquare,
          badgeCount: unreadMsgs,
        },
        { href: "/customer/reviews", label: "Reviews", icon: Star },
        {
          href: "/customer/notifications",
          label: "Notifications",
          icon: Bell,
          badgeCount: unreadNotifs,
        },
        { href: "/customer/profile", label: "My Profile & Addresses", icon: UserCircle2 },
        { href: "/explore", label: "Discover Designers", icon: MapPin },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
