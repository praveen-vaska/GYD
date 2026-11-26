"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronRight,
  LogOut,
  LucideIcon,
  Menu,
  Moon,
  RotateCcw,
  Sun,
  X,
} from "lucide-react";
import { GydLogo } from "@/components/common/gyd-logo";
import { useTheme } from "@/components/common/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useGydStore } from "@/features/store/gyd-store";
import { cn, getInitials } from "@/lib/utils";
import { UserRole } from "@/types";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeCount?: number;
}

interface DashboardShellProps {
  portalTitle: string;
  portalSubtitle: string;
  role: UserRole;
  navItems: DashboardNavItem[];
  children: React.ReactNode;
}

export function DashboardShell({
  portalTitle,
  portalSubtitle,
  role,
  navItems,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { pushToast } = useToast();
  const {
    state,
    hydrated,
    logout,
    markAllNotificationsRead,
    resetDemoState,
  } = useGydStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const activeSession = state.session;
  const sessionUser = activeSession
    ? state.users.find((u) => u.id === activeSession.userId)
    : undefined;
  const sessionDesigner =
    activeSession?.designerId
      ? state.designers.find((d) => d.id === activeSession.designerId)
      : activeSession?.role === "DESIGNER"
        ? state.designers.find((d) => d.userId === activeSession.userId)
        : undefined;

  const isSessionBlocked =
    Boolean(activeSession) &&
    activeSession?.role !== "ADMIN" &&
    (!sessionUser ||
      sessionUser.status !== "ACTIVE" ||
      (activeSession?.role === "DESIGNER" &&
        (!sessionDesigner ||
          sessionDesigner.approvalStatus === "SUSPENDED" ||
          sessionDesigner.approvalStatus === "REJECTED")));

  const isAuthorized =
    Boolean(activeSession) &&
    !isSessionBlocked &&
    (role === "ADMIN"
      ? activeSession?.role === "ADMIN" && !activeSession.isDemoSession
      : activeSession?.role === role ||
        (activeSession?.role === "ADMIN" && !activeSession.isDemoSession));

  const roleNotifications = state.notifications.filter((n) => n.role === role);
  const unreadNotifs = roleNotifications.filter((n) => !n.isRead).length;

  if (hydrated && isSessionBlocked) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12">
        <div className="gyd-panel max-w-lg w-full p-8 text-center space-y-5">
          <div className="flex justify-center">
            <GydLogo />
          </div>
          <Badge tone="error" className="mx-auto">
            Access Restricted
          </Badge>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-brand-text">
            Account Blocked or Removed
          </h1>
          <p className="text-sm text-brand-text-secondary">
            This account or studio profile has been suspended or removed by a GYD
            Administrator. Contact platform support or sign out to switch accounts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              variant="primary"
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              Sign Out & Return to Login
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Return to Public Storefront</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (hydrated && !isAuthorized) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12">
        <div className="gyd-panel max-w-lg w-full p-8 text-center space-y-5">
          <div className="flex justify-center">
            <GydLogo />
          </div>
          <Badge tone="accent" className="mx-auto">
            {role === "ADMIN"
              ? "Restricted Administrator Operations"
              : role === "DESIGNER"
                ? "Designer Partner Access Required"
                : "Customer Sign In Required"}
          </Badge>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-brand-text">
            {role === "ADMIN"
              ? "Administrator Authentication Required"
              : role === "DESIGNER"
                ? activeSession?.role === "CUSTOMER"
                  ? "Partner Designer Account Required"
                  : "Sign in to access Designer Studio"
                : `Sign in to access the ${portalTitle}`}
          </h1>
          <p className="text-sm text-brand-text-secondary">
            {role === "ADMIN"
              ? "Unauthorized visitors, customers, and designers are restricted from the Admin console. Sign in with authorized administrator credentials to proceed."
              : role === "DESIGNER"
                ? activeSession?.role === "CUSTOMER"
                  ? `You are signed in as a Customer (${activeSession.name}). Customer accounts cannot open Designer Studio — sign in with a Designer account or register as a partner designer.`
                  : "Only registered partner designers can open Designer Studio. Sign in with your designer credentials or apply to register a designer profile."
                : "Sign in or create a free customer account to view your bookings, wishlist, and designer messages."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {role === "ADMIN" ? (
              <Button asChild variant="primary">
                <Link href="/admin/login">Administrator Sign In</Link>
              </Button>
            ) : role === "DESIGNER" ? (
              <>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (activeSession) logout();
                    router.push("/login?role=designer&next=/designer/dashboard");
                  }}
                >
                  Designer Sign In
                </Button>
                <Button asChild variant="accent">
                  <Link href="/become-a-designer">Register as a Designer</Link>
                </Button>
              </>
            ) : (
              <Button asChild variant="primary">
                <Link href="/login?next=/customer/dashboard">
                  Sign In / Create Account
                </Link>
              </Button>
            )}
          </div>
          {role === "DESIGNER" && activeSession?.role === "CUSTOMER" && (
            <div className="pt-1">
              <Link
                href="/customer/dashboard"
                className="text-xs font-semibold text-brand-primary hover:underline"
              >
                ← Back to Customer Dashboard
              </Link>
            </div>
          )}
          <div className="pt-2">
            <Link
              href="/"
              className="text-xs font-semibold text-brand-muted-fg hover:text-brand-primary"
            >
              ← Return to Public Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        <div className="px-2">
          <GydLogo subtitle={portalSubtitle} />
        </div>

        <nav className="space-y-1" aria-label={`${portalTitle} navigation`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-brand-primary text-brand-primary-fg shadow-sm"
                    : "text-brand-text-secondary hover:bg-brand-surface-muted hover:text-brand-text"
                )}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.badgeCount === "number" && item.badgeCount > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-bold",
                      active
                        ? "bg-brand-accent text-white"
                        : "bg-brand-highlight text-brand-accent"
                    )}
                  >
                    {item.badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 pt-4 border-t border-brand-border">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 justify-start"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            <LogOut className="h-4 w-4 text-brand-error" />
            Logout
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Reset demo data"
            aria-label="Reset demo data"
            onClick={() => {
              resetDemoState();
              pushToast({
                title: "Demo state restored",
                description: "All sample bookings, categories & settings reset.",
                type: "info",
              });
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 border-r border-brand-border bg-brand-surface sticky top-0 h-screen overflow-y-auto">
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="relative z-10 w-72 max-w-[85vw] bg-brand-surface h-full overflow-y-auto border-r border-brand-border shadow-2xl"
            >
              <div className="flex justify-end px-4 pt-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close sidebar"
                  className="rounded-xl p-1.5 text-brand-muted hover:bg-brand-surface-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {SidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 border-b border-brand-border bg-brand-surface/95 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
                className="flex lg:hidden h-9.5 w-9.5 items-center justify-center rounded-xl border border-brand-border bg-brand-bg text-brand-text"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-brand-muted-fg">
                  <Link href="/" className="hover:text-brand-primary">
                    Storefront
                  </Link>
                  <ChevronRight className="h-3 w-3" />
                  <span className="truncate font-semibold text-brand-text">
                    {portalTitle}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Badge tone="primary" className="hidden sm:inline-flex">
                {role === "ADMIN" ? "Authenticated · Admin" : `Demo Mode · ${role}`}
              </Badge>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle color theme"
                className="flex h-9.5 w-9.5 items-center justify-center rounded-xl border border-brand-border bg-brand-bg text-brand-text hover:bg-brand-surface-muted cursor-pointer"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4 text-brand-accent" />
                )}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((v) => !v)}
                  aria-label="Notifications"
                  className="relative flex h-9.5 w-9.5 items-center justify-center rounded-xl border border-brand-border bg-brand-bg text-brand-text hover:bg-brand-surface-muted cursor-pointer"
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-white">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-brand-border bg-brand-surface p-3 shadow-xl z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-brand-border">
                      <span className="text-sm font-bold text-brand-text">
                        Notifications
                      </span>
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-xs font-semibold text-brand-accent hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                      {roleNotifications.length === 0 ? (
                        <p className="py-4 text-center text-xs text-brand-muted-fg">
                          No notifications right now.
                        </p>
                      ) : (
                        roleNotifications.slice(0, 6).map((n) => (
                          <Link
                            key={n.id}
                            href={n.linkHref}
                            onClick={() => setNotifOpen(false)}
                            className={cn(
                              "block rounded-xl p-2.5 text-xs transition-colors",
                              n.isRead
                                ? "bg-brand-bg/50 text-brand-text-secondary"
                                : "bg-brand-secondary/50 text-brand-text"
                            )}
                          >
                            <p className="font-semibold">{n.title}</p>
                            <p className="mt-0.5 text-brand-text-secondary">
                              {n.message}
                            </p>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {activeSession && (
                <div className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-bg px-2.5 py-1.5">
                  <span className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-brand-primary text-[11px] font-bold text-brand-primary-fg">
                    {getInitials(activeSession.name)}
                  </span>
                  <span className="hidden md:inline text-xs font-semibold text-brand-text">
                    {activeSession.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:px-10 max-w-[1640px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
