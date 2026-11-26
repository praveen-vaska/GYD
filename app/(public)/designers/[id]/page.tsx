"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Check,
  Clock,
  Heart,
  MapPin,
  MessageSquare,
  Share2,
  Shield,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { APPOINTMENT_TYPE_META } from "@/constants/gyd";
import { useGydStore } from "@/features/store/gyd-store";
import { formatDateShort, formatINR } from "@/lib/utils";
import { Portfolio } from "@/types";

export default function DesignerProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { pushToast } = useToast();
  const {
    state,
    isFavourited,
    toggleFavourite,
    startOrOpenConversation,
    sendMessage,
  } = useGydStore();

  const designer = state.designers.find((d) => d.id === params.id);
  const designerOwner = designer
    ? state.users.find((u) => u.id === designer.userId)
    : undefined;
  const isSuspendedOrBlocked =
    !designer ||
    designer.approvalStatus === "SUSPENDED" ||
    designer.approvalStatus === "REJECTED" ||
    !designerOwner ||
    designerOwner.status !== "ACTIVE";
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryText, setEnquiryText] = useState("");

  if (!designer || (isSuspendedOrBlocked && state.session?.role !== "ADMIN")) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <EmptyState
          title="Designer profile unavailable"
          description="This profile may have been removed or is currently suspended by platform moderation."
          actionLabel="Explore Designers"
          onAction={() => router.push("/explore")}
        />
      </div>
    );
  }

  const isPubliclyBookable =
    !isSuspendedOrBlocked &&
    (!state.settings.requireDesignerVerification ||
      designer.approvalStatus === "APPROVED");

  const services = state.services.filter(
    (s) => s.designerId === designer.id && s.isActive
  );
  const portfolios = state.portfolios.filter(
    (p) => p.designerId === designer.id
  );
  const schedule = state.availability.find(
    (a) => a.designerId === designer.id
  );
  const reviews = state.reviews.filter(
    (r) => r.designerId === designer.id && r.moderationStatus === "PUBLISHED"
  );
  const fav = isFavourited(designer.id);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      pushToast({
        title: "Profile link copied",
        description: `Copied ${designer.name}'s GYD portfolio URL.`,
        type: "success",
      });
    } catch {
      pushToast({
        title: "Share ready",
        description: shareUrl,
        type: "info",
      });
    }
  };

  const handleSendEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (enquiryText.trim().length < 5) {
      pushToast({
        title: "Message too short",
        description: "Please include at least a brief note about your occasion.",
        type: "warning",
      });
      return;
    }
    const convRes = startOrOpenConversation(designer.id);
    if (convRes.ok && convRes.data) {
      sendMessage(convRes.data.id, enquiryText.trim());
      setEnquiryText("");
      setEnquiryOpen(false);
      pushToast({
        title: "Enquiry sent to studio",
        description: `Your message is live in Customer Messages with ${designer.name}.`,
        type: "success",
      });
    } else if (convRes.error) {
      pushToast({
        title: "Unable to send enquiry",
        description: convRes.error,
        type: "error",
      });
    }
  };

  return (
    <div className="pb-16">
      {/* Cover Banner */}
      <div className="relative h-56 sm:h-72 lg:h-80 w-full overflow-hidden bg-brand-primary">
        <Image
          src={designer.coverImageUrl}
          alt={`${designer.name} atelier cover`}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/20" />
        <div className="gyd-container pt-6 relative z-10">
          <Button asChild variant="secondary" size="sm">
            <Link href="/explore">
              <ArrowLeft className="h-4 w-4" />
              Back to Designers
            </Link>
          </Button>
        </div>
      </div>

      <div className="gyd-container -mt-16 relative z-20 space-y-10">
        {/* Profile Header Card */}
        <section className="gyd-panel p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-2xl border-4 border-brand-surface shadow-lg bg-brand-secondary">
              <Image
                src={designer.avatarUrl}
                alt={designer.name}
                fill
                sizes="128px"
                className="object-cover object-top"
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {designer.isVerified ? (
                  <Badge tone="success">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified GYD Studio
                  </Badge>
                ) : (
                  <Badge tone="warning">Pending Verification</Badge>
                )}
                {designer.categoryNames.map((c) => (
                  <Badge key={c} tone="primary">
                    {c}
                  </Badge>
                ))}
              </div>

              <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-brand-text">
                {designer.name}
              </h1>
              <p className="text-sm sm:text-base font-medium text-brand-text-secondary">
                {designer.title}
              </p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-brand-text-secondary pt-1">
                <span className="inline-flex items-center gap-1.5 font-semibold text-brand-text">
                  <Star className="h-4 w-4 fill-brand-accent text-brand-accent" />
                  {designer.rating.toFixed(1)} ({designer.reviewCount} reviews)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-brand-accent" />
                  {designer.city} · {designer.serviceRadiusKm} km service radius
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-brand-primary" />
                  {designer.experienceYears} years experience ·{" "}
                  {designer.completedProjectsCount} projects
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-3 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-brand-border">
            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                Consultations Starting At
              </p>
              <p className="font-editorial text-3xl font-semibold text-brand-text">
                {formatINR(designer.startingPriceInr)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isPubliclyBookable ? (
                <Button asChild variant="primary" size="md">
                  <Link href={`/book/${designer.id}`}>Book Designer</Link>
                </Button>
              ) : (
                <Button variant="outline" size="md" disabled>
                  Verification Pending
                </Button>
              )}
              <Button
                variant="accent"
                size="md"
                onClick={() => setEnquiryOpen(true)}
              >
                <MessageSquare className="h-4 w-4" />
                Send Enquiry
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Add to wishlist"
                onClick={() => {
                  const r = toggleFavourite(designer.id);
                  pushToast({
                    title: r.data ? "Added to Wishlist" : "Removed from Wishlist",
                    type: "info",
                  });
                }}
              >
                <Heart
                  className={`h-4 w-4 ${
                    fav ? "fill-brand-accent text-brand-accent" : ""
                  }`}
                />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Share profile"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Main 2-column content */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          <div className="lg:col-span-8 space-y-8">
            {/* About & Skills */}
            <section className="gyd-card p-6 sm:p-8 space-y-5">
              <h2 className="font-editorial text-2xl font-semibold text-brand-text">
                About the Atelier
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-brand-text-secondary">
                {designer.bio}
              </p>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg mb-2.5">
                  Core Specialties & Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {designer.skills.map((skill) => (
                    <Badge key={skill} tone="neutral">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg mb-2.5">
                  Supported Appointment Modes
                </h3>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {designer.supportedAppointmentTypes.map((mode) => (
                    <div
                      key={mode}
                      className="rounded-xl border border-brand-border bg-brand-bg p-3"
                    >
                      <p className="text-xs font-bold text-brand-primary">
                        {APPOINTMENT_TYPE_META[mode].label}
                      </p>
                      <p className="mt-0.5 text-xs text-brand-text-secondary">
                        {APPOINTMENT_TYPE_META[mode].description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Services & Packages */}
            <section className="space-y-4">
              <h2 className="font-editorial text-2xl font-semibold text-brand-text">
                Services & Curated Packages
              </h2>
              {services.length === 0 ? (
                <EmptyState
                  title="No active services listed"
                  description="Send an enquiry to request a custom package."
                />
              ) : (
                <div className="space-y-4">
                  {services.map((srv) => (
                    <article key={srv.id} className="gyd-card p-5 sm:p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <Badge tone="accent">{srv.subcategoryName}</Badge>
                          <h3 className="font-editorial text-xl font-semibold text-brand-text">
                            {srv.title}
                          </h3>
                          <p className="text-sm text-brand-text-secondary">
                            {srv.description}
                          </p>
                          <p className="text-xs text-brand-muted-fg">
                            Duration: {srv.durationMinutes} mins · Travel fee (on-site):{" "}
                            {srv.travelChargeInr > 0
                              ? formatINR(srv.travelChargeInr)
                              : "Included"}
                          </p>
                        </div>
                        <div className="sm:text-right shrink-0 space-y-2">
                          <p className="text-xl font-bold text-brand-text">
                            {formatINR(srv.priceInr)}
                          </p>
                          {isPubliclyBookable && (
                            <Button asChild size="sm" variant="primary">
                              <Link
                                href={`/book/${designer.id}?serviceId=${srv.id}`}
                              >
                                Select & Book
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>

                      {srv.packages.length > 0 && (
                        <div className="grid gap-3 sm:grid-cols-2 border-t border-brand-border pt-4">
                          {srv.packages.map((pkg) => (
                            <div
                              key={pkg.id}
                              className="rounded-xl border border-brand-border bg-brand-bg p-3.5 space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-bold text-brand-text">
                                  {pkg.name}
                                </p>
                                <span className="text-sm font-bold text-brand-primary">
                                  {formatINR(pkg.priceInr)}
                                </span>
                              </div>
                              <p className="text-xs text-brand-text-secondary">
                                {pkg.description}
                              </p>
                              <ul className="space-y-1">
                                {pkg.deliverables.map((del) => (
                                  <li
                                    key={del}
                                    className="flex items-center gap-1.5 text-xs text-brand-text-secondary"
                                  >
                                    <Check className="h-3.5 w-3.5 text-brand-success shrink-0" />
                                    {del}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* Portfolio Gallery */}
            <section className="space-y-4">
              <h2 className="font-editorial text-2xl font-semibold text-brand-text">
                Portfolio & Past Commissions
              </h2>
              {portfolios.length === 0 ? (
                <EmptyState
                  title="Portfolio gallery coming soon"
                  description="This designer is currently curating new project lookbooks."
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {portfolios.map((port) => (
                    <button
                      key={port.id}
                      type="button"
                      onClick={() => setSelectedPortfolio(port)}
                      className="gyd-card group overflow-hidden text-left cursor-pointer"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-brand-secondary">
                        <Image
                          src={port.coverImageUrl}
                          alt={port.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-4 space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-accent">
                          {port.occasion} · {port.city}
                        </span>
                        <h3 className="font-editorial text-lg font-semibold text-brand-text">
                          {port.title}
                        </h3>
                        <p className="text-xs text-brand-text-secondary line-clamp-2">
                          {port.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Customer Reviews */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-editorial text-2xl font-semibold text-brand-text">
                  Client Reviews
                </h2>
                <Badge tone="neutral">Sample Demo Reviews Included</Badge>
              </div>
              {reviews.length === 0 ? (
                <EmptyState
                  title="No published reviews yet"
                  description="Verified reviews appear once clients complete their booked appointments."
                />
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <article key={rev.id} className="gyd-card p-5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-brand-text">
                            {rev.customerName}
                          </span>
                          {rev.isDemoSample && (
                            <Badge tone="neutral" className="text-[10px]">
                              Demo Sample
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-brand-primary">
                          <Star className="h-3.5 w-3.5 fill-brand-accent text-brand-accent" />
                          {rev.rating.toFixed(1)}
                        </div>
                      </div>
                      <p className="text-xs text-brand-muted-fg">
                        {rev.serviceTitle} · {formatDateShort(rev.createdAt)}
                      </p>
                      <p className="text-sm text-brand-text-secondary">
                        {rev.comment}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Sticky Availability + Privacy Notice + FAQs */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="gyd-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-brand-accent" />
                <h2 className="font-editorial text-xl font-semibold text-brand-text">
                  Live Slot Calendar
                </h2>
              </div>
              <p className="text-xs text-brand-text-secondary">
                Working Hours: {schedule?.workingHoursStart ?? "10:00 AM"} –{" "}
                {schedule?.workingHoursEnd ?? "07:00 PM"}
              </p>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {Array.from(
                  new Set((schedule?.slots ?? []).map((s) => s.date))
                )
                  .slice(0, 4)
                  .map((date) => {
                    const daySlots = (schedule?.slots ?? []).filter(
                      (s) => s.date === date
                    );
                    const isBlocked = schedule?.blockedDates.includes(date);
                    return (
                      <div
                        key={date}
                        className="rounded-xl border border-brand-border bg-brand-bg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-brand-text">
                            {formatDateShort(date)}
                          </span>
                          {isBlocked && <Badge tone="error">Blocked</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {daySlots.map((slot) => (
                            <span
                              key={slot.id}
                              className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${
                                slot.isAvailable && !isBlocked
                                  ? "bg-brand-success-bg text-brand-success"
                                  : "bg-brand-surface-muted text-brand-muted line-through"
                              }`}
                            >
                              {slot.startTime}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {isPubliclyBookable && (
                <Button asChild variant="primary" className="w-full">
                  <Link href={`/book/${designer.id}`}>
                    Reserve an Available Slot
                  </Link>
                </Button>
              )}
            </div>

            <div className="gyd-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-brand-primary">
                <Shield className="h-4.5 w-4.5" />
                <h3 className="text-sm font-bold">Privacy-First Direct Booking</h3>
              </div>
              <p className="text-xs leading-relaxed text-brand-text-secondary">
                Personal contact numbers and private studio addresses are protected
                until a booking is confirmed. Use Send Enquiry for instant messaging.
              </p>
            </div>

            {designer.faqs.length > 0 && (
              <div className="gyd-card p-5 space-y-3">
                <h3 className="font-editorial text-lg font-semibold text-brand-text">
                  Designer FAQs
                </h3>
                <div className="space-y-3">
                  {designer.faqs.map((faq) => (
                    <div key={faq.question} className="space-y-1">
                      <p className="text-xs font-bold text-brand-text">
                        {faq.question}
                      </p>
                      <p className="text-xs text-brand-text-secondary">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Portfolio Lightbox Modal */}
      <Modal
        open={Boolean(selectedPortfolio)}
        onClose={() => setSelectedPortfolio(null)}
        title={selectedPortfolio?.title}
        description={
          selectedPortfolio
            ? `${selectedPortfolio.categoryName} · ${selectedPortfolio.occasion} · ${selectedPortfolio.city}`
            : undefined
        }
        maxWidthClassName="max-w-2xl"
      >
        {selectedPortfolio && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedPortfolio.images.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl border border-brand-border"
                >
                  <Image
                    src={img.url}
                    alt={img.caption}
                    fill
                    sizes="400px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-brand-text-secondary">
              {selectedPortfolio.description}
            </p>
            {isPubliclyBookable && (
              <div className="flex justify-end">
                <Button asChild variant="primary">
                  <Link href={`/book/${designer.id}`}>
                    Book Similar Look with {designer.name}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Enquiry Modal */}
      <Modal
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        title={`Send Enquiry to ${designer.name}`}
        description="Ask about availability, custom packages, or multi-event coordination."
      >
        <form onSubmit={handleSendEnquiry} className="space-y-4">
          <Textarea
            value={enquiryText}
            onChange={(e) => setEnquiryText(e.target.value)}
            placeholder="Hi! I have an upcoming engagement in Hyderabad next month and would love guidance on outfits and accessories..."
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEnquiryOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Send Studio Message
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
