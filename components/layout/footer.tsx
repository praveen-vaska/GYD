"use client";

import React from "react";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { GydLogo } from "@/components/common/gyd-logo";
import { GYD_BRAND } from "@/constants/gyd";
import { useGydStore } from "@/features/store/gyd-store";

export function Footer() {
  const { state } = useGydStore();

  return (
    <footer className="border-t border-brand-border bg-brand-surface text-brand-text mt-auto">
      <div className="gyd-container py-12 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-4">
            <GydLogo subtitle={GYD_BRAND.tagline} />
            <p className="text-sm leading-relaxed text-brand-text-secondary max-w-sm">
              {state.cms.footerTagline}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GYD Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border bg-brand-bg text-brand-text hover:bg-brand-secondary transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GYD LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border bg-brand-bg text-brand-text hover:bg-brand-secondary transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GYD YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border bg-brand-bg text-brand-text hover:bg-brand-secondary transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="2" y="5" width="20" height="14" rx="4" />
                  <polygon points="10,9 16,12 10,15" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-brand-muted-fg">
              Marketplace
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/explore" className="text-brand-text-secondary hover:text-brand-primary transition-colors">
                  Explore Designers
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-brand-text-secondary hover:text-brand-primary transition-colors">
                  Services & Categories
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-brand-text-secondary hover:text-brand-primary transition-colors">
                  About GYD & How It Works
                </Link>
              </li>
              <li>
                <Link href="/become-a-designer" className="text-brand-text-secondary hover:text-brand-primary transition-colors">
                  Become a Designer
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-brand-muted-fg">
              Popular Categories
            </h3>
            <ul className="grid grid-cols-1 gap-2 text-sm">
              {state.categories
                .filter((c) => c.isActive && c.isPopular)
                .slice(0, 6)
                .map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/explore?category=${encodeURIComponent(c.name)}`}
                      className="text-brand-text-secondary hover:text-brand-primary transition-colors"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-brand-muted-fg">
              Support & Legal
            </h3>
            <ul className="space-y-2.5 text-sm text-brand-text-secondary">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-accent shrink-0" />
                <a href={`mailto:${GYD_BRAND.supportEmail}`} className="hover:text-brand-primary">
                  {GYD_BRAND.supportEmail}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-accent shrink-0" />
                <span>{GYD_BRAND.supportPhone}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-brand-accent shrink-0 mt-0.5" />
                <span>Hyderabad · Bengaluru · Mumbai · Chennai · New Delhi</span>
              </li>
              <li className="pt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <Link href="/how-it-works#faqs" className="hover:text-brand-primary underline-offset-4 hover:underline">
                  FAQs
                </Link>
                <Link href="/legal/privacy" className="hover:text-brand-primary underline-offset-4 hover:underline">
                  Privacy Policy
                </Link>
                <Link href="/legal/terms" className="hover:text-brand-primary underline-offset-4 hover:underline">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-brand-border pt-6 sm:flex-row sm:items-center sm:justify-between text-xs text-brand-muted-fg">
          <p>
            © 2026 GYD – Get Your Designer. All rights reserved. {GYD_BRAND.proposition}
          </p>
          <p>
            Frontend Demo Mode · Local sample profiles & sandbox Razorpay order preparation.
          </p>
        </div>
      </div>
    </footer>
  );
}
