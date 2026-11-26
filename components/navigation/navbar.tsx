"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Sun,
  UserCircle2,
  X,
} from "lucide-react";
import { GydLogo } from "@/components/common/gyd-logo";
import { useTheme } from "@/components/common/theme-provider";
import { Button } from "@/components/ui/button";
import { useGydStore } from "@/features/store/gyd-store";
import { getRoleDashboardPath } from "@/lib/auth/session";
import { cn, getInitials } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore Designers" },
  { href: "/categories", label: "Categories" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/become-a-designer", label: "Become a Designer" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const {
    state,
    logout,
  } = useGydStore();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const wishlistCount = state.session
    ? state.favourites.filter((f) => f.customerId === state.session?.userId).length
    : state.favourites.filter((f) => f.customerId === "usr-cust-1").length;

  return (
    <>
      {state.cms.promoBannerActive && (
        <div className="bg-brand-primary text-brand-primary-fg px-4 py-2 text-center text-xs sm:text-[13px] font-medium tracking-wide">
          <span>{state.cms.promoBannerText}</span>
        </div>
      )}

      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-200 border-b",
          scrolled
            ? "bg-brand-surface/95 backdrop-blur-md border-brand-border shadow-sm"
            : "bg-brand-bg/90 backdrop-blur-sm border-transparent"
        )}
      >
        <div className="gyd-container flex h-17 items-center justify-between gap-2 xl:gap-4">
          <div className="flex items-center gap-2 xl:gap-7 shrink-0">
            <GydLogo />

            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink-0" aria-label="Primary">
              {NAV_LINKS.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative whitespace-nowrap rounded-xl px-1.5 xl:px-3.5 py-1.5 xl:py-2 text-xs xl:text-sm font-semibold transition-colors",
                      active
                        ? "text-brand-primary bg-brand-secondary/70"
                        : "text-brand-text-secondary hover:text-brand-text hover:bg-brand-surface-muted"
                    )}
                  >
                    {item.label}
                    {active && (
                      <motion.span
                        layoutId="gyd-nav-indicator"
                        className="absolute bottom-1 left-1.5 right-1.5 xl:left-3 xl:right-3 h-0.5 rounded-full bg-brand-accent"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              className="flex h-9.5 w-9.5 items-center justify-center rounded-xl border border-brand-border bg-brand-surface text-brand-text hover:bg-brand-surface-muted transition-colors cursor-pointer"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4 text-brand-accent" />
              )}
            </button>

            <Link
              href="/customer/favourites"
              aria-label="Saved designer wishlist"
              className="relative flex h-9.5 w-9.5 items-center justify-center rounded-xl border border-brand-border bg-brand-surface text-brand-text hover:bg-brand-surface-muted transition-colors"
            >
              <Heart className="h-4 w-4" />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {state.session ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-surface px-2.5 py-1.5 text-sm font-semibold text-brand-text hover:bg-brand-surface-muted transition-colors cursor-pointer"
                >
                  <span className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-brand-primary text-[11px] font-bold text-brand-primary-fg">
                    {getInitials(state.session.name)}
                  </span>
                  <span className="hidden sm:inline max-w-[110px] truncate">
                    {state.session.name.split(" ")[0]}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-brand-muted" />
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute right-0 mt-2 w-64 rounded-2xl border border-brand-border bg-brand-surface p-2 shadow-xl z-50"
                    >
                      <div className="border-b border-brand-border px-3 py-2.5">
                        <p className="text-sm font-bold text-brand-text truncate">
                          {state.session.name}
                        </p>
                        <p className="text-xs text-brand-muted-fg truncate">
                          {state.session.role} Portal · {state.session.city}
                        </p>
                      </div>
                      <div className="py-1.5 space-y-1">
                        <Link
                          href={getRoleDashboardPath(state.session.role)}
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-brand-text hover:bg-brand-surface-muted"
                        >
                          <LayoutDashboard className="h-4 w-4 text-brand-accent" />
                          Go to My Dashboard
                        </Link>
                        {state.session.role === "CUSTOMER" && (
                          <Link
                            href="/customer/profile"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-brand-text hover:bg-brand-surface-muted"
                          >
                            <UserCircle2 className="h-4 w-4 text-brand-muted-fg" />
                            Profile & Addresses
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-brand-border pt-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setProfileMenuOpen(false);
                            router.push("/");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-brand-error hover:bg-brand-error-bg cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button asChild variant="primary" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">
                  <LogIn className="h-3.5 w-3.5" />
                  Login
                </Link>
              </Button>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="flex lg:hidden h-9.5 w-9.5 items-center justify-center rounded-xl border border-brand-border bg-brand-surface text-brand-text hover:bg-brand-surface-muted cursor-pointer"
            >
              {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-brand-border bg-brand-surface lg:hidden"
            >
              <div className="space-y-3 px-4 py-4">
                <div className="grid gap-1">
                  {NAV_LINKS.map((item) => {
                    const active =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "rounded-xl px-3.5 py-2.5 text-sm font-semibold",
                          active
                            ? "bg-brand-primary text-brand-primary-fg"
                            : "text-brand-text hover:bg-brand-surface-muted"
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                {!state.session && (
                  <div className="pt-2 border-t border-brand-border">
                    <Button asChild variant="primary" size="md" className="w-full">
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        <LogIn className="h-4 w-4" />
                        Login / Create Account
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
