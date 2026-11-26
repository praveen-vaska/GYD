"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  Compass,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GYD_BRAND } from "@/constants/gyd";
import { useGydStore } from "@/features/store/gyd-store";

export default function HowItWorksPage() {
  const { state } = useGydStore();
  const [openFaq, setOpenFaq] = useState<string | null>(
    state.cms.faqs[0]?.id ?? null
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <Badge tone="accent">{GYD_BRAND.proposition}</Badge>
        <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-brand-text">
          Creative Expertise, Without the Guesswork
        </h1>
        <p className="text-base sm:text-lg text-brand-text-secondary leading-relaxed">
          Whether you are planning a multi-day Hyderabad wedding, refreshing a
          Bengaluru living room, or preparing for an executive keynote, GYD connects
          you with vetted designers who bring bespoke direction to your doorstep.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button asChild variant="primary" size="lg">
            <Link href="/explore">
              Explore Designers
              <ArrowRight className="h-4.5 w-4.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/become-a-designer">Join as a Designer</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            num: "01",
            title: "Select Your Occasion",
            body: "Pick your category, city, and budget—whether online guidance from ₹499 or full bridal couture direction.",
            icon: Compass,
          },
          {
            num: "02",
            title: "Compare Verified Talent",
            body: "Review curated portfolio lookbooks, experience years, transparent fees, and real availability windows.",
            icon: ShieldCheck,
          },
          {
            num: "03",
            title: "Book Your Preferred Mode",
            body: "Choose Home Visit, Studio Appointment, Online Consultation, Shopping Assistance, or Event Venue Visit.",
            icon: CalendarCheck,
          },
          {
            num: "04",
            title: "Execute Effortlessly",
            body: "Share moodboards inside GYD Messaging, track milestones, and finalize your celebration or makeover.",
            icon: Wand2,
          },
        ].map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.num} className="gyd-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-secondary text-brand-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-editorial text-3xl font-bold text-brand-muted/50">
                  {step.num}
                </span>
              </div>
              <h2 className="font-editorial text-xl font-semibold text-brand-text">
                {step.title}
              </h2>
              <p className="text-sm text-brand-text-secondary leading-relaxed">
                {step.body}
              </p>
            </div>
          );
        })}
      </section>

      <section id="faqs" className="gyd-panel p-6 sm:p-10 space-y-6">
        <div className="space-y-2">
          <Badge tone="primary">Frequently Asked Questions</Badge>
          <h2 className="font-editorial text-3xl font-semibold text-brand-text">
            Policies, Verification & Booking Details
          </h2>
        </div>

        <div className="divide-y divide-brand-border">
          {state.cms.faqs.map((faq) => {
            const isOpen = openFaq === faq.id;
            return (
              <div key={faq.id} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                  className="flex w-full items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <span className="font-semibold text-base text-brand-text">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-4.5 w-4.5 text-brand-muted-fg shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-2.5 text-sm leading-relaxed text-brand-text-secondary">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-brand-secondary/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-brand-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-brand-text">
                Transparent Cancellation Policy
              </p>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Cancel {state.settings.cancellationFreeHours}+ hours prior for a full
                policy refund, or within {state.settings.cancellationFreeHours} hours
                for a {state.settings.partialRefundPercent}% refund.
              </p>
            </div>
          </div>
          <Button asChild variant="primary" size="sm">
            <Link href="/explore">Browse Designers</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
