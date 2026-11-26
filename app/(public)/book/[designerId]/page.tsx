"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  Lock,
  MapPin,
  Navigation,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { APPOINTMENT_TYPE_META, OCCASION_OPTIONS } from "@/constants/gyd";
import { useGydStore } from "@/features/store/gyd-store";
import { formatDateShort, formatINR } from "@/lib/utils";
import { AppointmentType, Booking, OccasionType } from "@/types";

const STEP_LABELS = [
  "Service",
  "Occasion",
  "Requirements",
  "Location",
  "Visit Mode",
  "Date & Slot",
  "Review",
  "Payment",
  "Confirmed",
];

function BookingFlowContent() {
  const params = useParams<{ designerId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { pushToast } = useToast();
  const { state, createBooking } = useGydStore();

  const designer = state.designers.find((d) => d.id === params.designerId);
  const designerOwner = designer
    ? state.users.find((u) => u.id === designer.userId)
    : undefined;
  const activeActorUser = state.session
    ? state.users.find((u) => u.id === state.session?.userId)
    : undefined;
  const designerServices = state.services.filter(
    (s) => s.designerId === params.designerId && s.isActive
  );
  const schedule = state.availability.find(
    (a) => a.designerId === params.designerId
  );

  const preselectedServiceId =
    searchParams.get("serviceId") ?? designerServices[0]?.id ?? "";

  const [step, setStep] = useState<number>(1);
  const [serviceId, setServiceId] = useState(preselectedServiceId);
  const [occasion, setOccasion] = useState<OccasionType>("Wedding");

  // Step 3 Requirements
  const [occasionDate, setOccasionDate] = useState("2026-12-18");
  const [preferredStyle, setPreferredStyle] = useState("Modern Heritage Pastel");
  const [budgetInr, setBudgetInr] = useState("35000");
  const [peopleCount, setPeopleCount] = useState("2");
  const [additionalRequirements, setAdditionalRequirements] = useState(
    "Looking for cohesive outfit, colour palette, and accessory coordination."
  );
  const [referenceNames, setReferenceNames] = useState<string[]>([
    "style-inspiration-board.jpg",
  ]);
  const [notes, setNotes] = useState("");

  // Step 4 Location
  const savedAddresses = state.addresses.filter(
    (a) => a.userId === (state.session?.userId ?? "usr-cust-1")
  );
  const [locationType, setLocationType] = useState<
    "Home" | "Event Venue" | "Custom Address" | "Current Location"
  >("Home");
  const [selectedAddressId, setSelectedAddressId] = useState(
    savedAddresses[0]?.id ?? ""
  );
  const [customAddress, setCustomAddress] = useState("");
  const [geoStatus, setGeoStatus] = useState<string>("");

  // Step 5 Appointment Type
  const [appointmentType, setAppointmentType] = useState<AppointmentType>(
    designer?.supportedAppointmentTypes[0] ?? "ONLINE_CONSULTATION"
  );

  // Step 6 Date & Time
  const availableDates = useMemo(() => {
    const dates = Array.from(
      new Set((schedule?.slots ?? []).map((s) => s.date))
    ).filter((d) => !(schedule?.blockedDates ?? []).includes(d));
    return dates;
  }, [schedule]);
  const [selectedDate, setSelectedDate] = useState(availableDates[0] ?? "2026-11-27");
  const [selectedSlotId, setSelectedSlotId] = useState("");

  // Step 7 & 8 Coupon + Payment
  const [couponCode, setCouponCode] = useState("");
  const [paymentMode, setPaymentMode] = useState<"DEPOSIT" | "FULL">("DEPOSIT");
  const [paymentAction, setPaymentAction] = useState<"SANDBOX_HOLD" | "PAY_LATER">(
    "SANDBOX_HOLD"
  );
  const [idempotencyKey] = useState(
    () => `idem-${params.designerId}-${Date.now()}`
  );
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (state.session && (!activeActorUser || activeActorUser.status !== "ACTIVE")) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <EmptyState
          title="Account Blocked or Inactive"
          description="Your account is currently suspended by moderation and cannot initiate new bookings."
          actionLabel="Return to Home"
          onAction={() => router.push("/")}
        />
      </div>
    );
  }

  if (
    !designer ||
    designer.approvalStatus === "SUSPENDED" ||
    designer.approvalStatus === "REJECTED" ||
    !designerOwner ||
    designerOwner.status !== "ACTIVE"
  ) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <EmptyState
          title="Designer unavailable"
          description="This studio has been suspended or removed from the marketplace."
          actionLabel="Explore Designers"
          onAction={() => router.push("/explore")}
        />
      </div>
    );
  }

  if (
    state.settings.requireDesignerVerification &&
    designer.approvalStatus !== "APPROVED"
  ) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <EmptyState
          title="Designer Verification Pending"
          description="Per GYD business rules, customers can book only verified and approved designers."
          actionLabel="Browse Approved Designers"
          onAction={() => router.push("/explore")}
        />
      </div>
    );
  }

  const selectedService =
    designerServices.find((s) => s.id === serviceId) ?? designerServices[0];

  const daySlots = (schedule?.slots ?? []).filter(
    (sl) => sl.date === selectedDate
  );
  const chosenSlot =
    daySlots.find((s) => s.id === selectedSlotId) ??
    daySlots.find((s) => s.isAvailable);

  const travelFeeInr =
    appointmentType === "ONLINE_CONSULTATION" ||
    appointmentType === "STUDIO_APPOINTMENT"
      ? 0
      : selectedService?.travelChargeInr ?? 0;
  const platformServiceFeeInr = Math.round(
    (selectedService?.priceInr ?? 0) * 0.05
  );
  const matchedCoupon = state.coupons.find(
    (c) =>
      c.isActive &&
      c.code.toUpperCase() === couponCode.trim().toUpperCase() &&
      (selectedService?.priceInr ?? 0) >= c.minOrderInr
  );
  const discountInr = matchedCoupon
    ? Math.min(
        matchedCoupon.maxDiscountInr,
        Math.round(
          ((selectedService?.priceInr ?? 0) * matchedCoupon.discountPercent) / 100
        )
      )
    : 0;
  const totalAmountInr = Math.max(
    499,
    (selectedService?.priceInr ?? 0) +
      travelFeeInr +
      platformServiceFeeInr -
      discountInr
  );
  const depositAmountInr = Math.round(
    (totalAmountInr * state.settings.depositPercentage) / 100
  );

  const resolvedAddress = (() => {
    if (appointmentType === "ONLINE_CONSULTATION") {
      return "GYD Encrypted Video Studio (link shared upon confirmation)";
    }
    if (locationType === "Custom Address") {
      return customAddress.trim() || `Custom address in ${designer.city}`;
    }
    if (locationType === "Current Location") {
      return geoStatus || `Current GPS Pin · ${designer.city}`;
    }
    const found = savedAddresses.find((a) => a.id === selectedAddressId);
    if (found) return `${found.line1}, ${found.city} - ${found.pincode}`;
    return `${locationType} in ${designer.city}`;
  })();

  const handleRequestGeo = () => {
    if (!navigator.geolocation) {
      setGeoStatus(`Geolocation unavailable · Using ${designer.city} centre`);
      return;
    }
    setGeoStatus("Requesting browser location permission...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus(
          `Lat ${pos.coords.latitude.toFixed(3)}, Lng ${pos.coords.longitude.toFixed(
            3
          )} (${designer.city})`
        );
      },
      () => {
        setGeoStatus(`Location permission denied · Using ${designer.city}`);
      }
    );
  };

  const handleNext = () => {
    if (step === 3) {
      if (!occasionDate || additionalRequirements.trim().length < 10) {
        pushToast({
          title: "Complete requirements",
          description:
            "Please set an occasion date and describe your styling brief (10+ characters).",
          type: "warning",
        });
        return;
      }
    }
    if (step === 4 && locationType === "Custom Address" && !customAddress.trim()) {
      pushToast({
        title: "Address required",
        description: "Please enter your venue or custom street address.",
        type: "warning",
      });
      return;
    }
    if (step === 6 && (!chosenSlot || !chosenSlot.isAvailable)) {
      pushToast({
        title: "Choose an available slot",
        description: "The selected slot is unavailable to prevent double booking.",
        type: "warning",
      });
      return;
    }
    setStep((s) => Math.min(9, s + 1));
  };

  const handleConfirmBooking = () => {
    if (!selectedService || !chosenSlot) return;
    setIsSubmitting(true);
    const res = createBooking({
      designerId: designer.id,
      serviceId: selectedService.id,
      occasion,
      appointmentType,
      date: chosenSlot.date,
      startTime: chosenSlot.startTime,
      endTime: chosenSlot.endTime,
      slotId: chosenSlot.id,
      addressLabel: locationType,
      addressFull: resolvedAddress,
      city: designer.city,
      paymentMode,
      initiateDemoPayment: paymentAction === "SANDBOX_HOLD",
      couponCode,
      requirements: {
        occasionDate,
        preferredStyle,
        budgetInr: Number(budgetInr) || 15000,
        peopleCount: Number(peopleCount) || 1,
        additionalRequirements,
        referenceImageNames: referenceNames,
        notes,
      },
      idempotencyKey,
    });
    setIsSubmitting(false);

    if (!res.ok || !res.data) {
      pushToast({
        title: "Booking could not be submitted",
        description: res.error ?? "Please check availability and try again.",
        type: "error",
      });
      return;
    }
    setCreatedBooking(res.data);
    setStep(9);
    pushToast({
      title: `Booking Request ${res.data.bookingCode} Created`,
      description: "Your designer has been notified.",
      type: "success",
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/designers/${designer.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted-fg hover:text-brand-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {designer.name}
          </Link>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-brand-text mt-1">
            Book {designer.name}
          </h1>
          <p className="text-sm text-brand-text-secondary">
            {designer.title} · {designer.city}
          </p>
        </div>
        <Badge tone="primary">
          Step {step} of 9 · {STEP_LABELS[step - 1]}
        </Badge>
      </div>

      {/* Stepper Bar */}
      <div className="gyd-card p-3 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-[640px]">
          {STEP_LABELS.map((label, idx) => {
            const num = idx + 1;
            const active = num === step;
            const done = num < step;
            return (
              <div
                key={label}
                className={`flex flex-1 items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-brand-primary text-brand-primary-fg"
                    : done
                      ? "bg-brand-success-bg text-brand-success"
                      : "bg-brand-bg text-brand-muted-fg"
                }`}
              >
                <span className="font-bold">{num}.</span>
                <span className="truncate">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Body */}
      <div className="gyd-panel p-6 sm:p-8">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-editorial text-2xl font-semibold text-brand-text">
              Step 1 · Select Your Service
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {designerServices.map((srv) => {
                const selected = srv.id === selectedService?.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setServiceId(srv.id)}
                    className={`rounded-2xl border p-5 text-left transition-all cursor-pointer ${
                      selected
                        ? "border-brand-primary bg-brand-secondary/50 shadow-sm"
                        : "border-brand-border bg-brand-bg hover:border-brand-border-strong"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Badge tone="accent">{srv.subcategoryName}</Badge>
                      <span className="font-bold text-brand-text">
                        {formatINR(srv.priceInr)}
                      </span>
                    </div>
                    <h3 className="font-editorial text-lg font-semibold text-brand-text mt-2">
                      {srv.title}
                    </h3>
                    <p className="mt-1 text-xs text-brand-text-secondary">
                      {srv.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-editorial text-2xl font-semibold text-brand-text">
              Step 2 · Select Occasion
            </h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              {OCCASION_OPTIONS.map((occ) => (
                <button
                  key={occ}
                  type="button"
                  onClick={() => setOccasion(occ)}
                  className={`rounded-2xl border p-4 text-center text-sm font-semibold transition-all cursor-pointer ${
                    occasion === occ
                      ? "border-brand-primary bg-brand-primary text-brand-primary-fg shadow-sm"
                      : "border-brand-border bg-brand-bg text-brand-text hover:bg-brand-secondary/50"
                  }`}
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-editorial text-2xl font-semibold text-brand-text">
              Step 3 · Describe Your Requirements
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Occasion Date
                </label>
                <Input
                  type="date"
                  value={occasionDate}
                  onChange={(e) => setOccasionDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Preferred Style / Aesthetic
                </label>
                <Input
                  value={preferredStyle}
                  onChange={(e) => setPreferredStyle(e.target.value)}
                  placeholder="e.g., Soft Pastel Handloom, Minimalist Modern"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Estimated Outfit / Project Budget (INR)
                </label>
                <Input
                  type="number"
                  value={budgetInr}
                  onChange={(e) => setBudgetInr(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Number of People
                </label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                Additional Requirements & Goals
              </label>
              <Textarea
                value={additionalRequirements}
                onChange={(e) => setAdditionalRequirements(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Reference Lookbook Images (Cloudinary Ready)
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-dashed border-brand-border-strong bg-brand-bg p-3 text-xs font-semibold text-brand-primary cursor-pointer hover:bg-brand-secondary/40">
                  <Upload className="h-4 w-4" />
                  <span>Attach inspiration photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []).map(
                        (f) => f.name
                      );
                      if (files.length > 0) setReferenceNames(files);
                    }}
                  />
                </label>
                <p className="text-[11px] text-brand-muted-fg">
                  Attached: {referenceNames.join(", ")}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Private Styling Notes
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional sizing, fabric, or timing notes"
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-editorial text-2xl font-semibold text-brand-text">
              Step 4 · Select Location
            </h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              {(
                ["Home", "Event Venue", "Custom Address", "Current Location"] as const
              ).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocationType(loc)}
                  className={`rounded-2xl border p-3.5 text-sm font-semibold cursor-pointer ${
                    locationType === loc
                      ? "border-brand-primary bg-brand-primary text-brand-primary-fg"
                      : "border-brand-border bg-brand-bg text-brand-text hover:bg-brand-secondary/40"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>

            {(locationType === "Home" || locationType === "Event Venue") &&
              savedAddresses.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                    Saved Addresses
                  </label>
                  <Select
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                  >
                    {savedAddresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label} — {a.line1}, {a.city} ({a.pincode})
                      </option>
                    ))}
                  </Select>
                </div>
              )}

            {locationType === "Custom Address" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Full Venue or Residence Address
                </label>
                <Textarea
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  placeholder={`Enter street, landmark, and PIN code in ${designer.city}`}
                />
              </div>
            )}

            {locationType === "Current Location" && (
              <div className="rounded-2xl border border-brand-border bg-brand-bg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-sm text-brand-text">
                  <Navigation className="h-4 w-4 text-brand-accent" />
                  <span>{geoStatus || "Detect current browser coordinates"}</span>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleRequestGeo}>
                  Detect Location
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <h2 className="font-editorial text-2xl font-semibold text-brand-text">
              Step 5 · Choose Appointment Type
            </h2>
            <p className="text-xs text-brand-text-secondary">
              Showing only visit modes configured and supported by {designer.name}.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {designer.supportedAppointmentTypes.map((mode) => {
                const meta = APPOINTMENT_TYPE_META[mode];
                const selected = appointmentType === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAppointmentType(mode)}
                    className={`rounded-2xl border p-4 text-left cursor-pointer transition-all ${
                      selected
                        ? "border-brand-primary bg-brand-secondary/60 shadow-sm"
                        : "border-brand-border bg-brand-bg hover:border-brand-border-strong"
                    }`}
                  >
                    <p className="font-semibold text-sm text-brand-text">
                      {meta.label}
                    </p>
                    <p className="mt-1 text-xs text-brand-text-secondary">
                      {meta.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-5">
            <h2 className="font-editorial text-2xl font-semibold text-brand-text">
              Step 6 · Select Date & Conflict-Free Slot
            </h2>
            <div className="flex flex-wrap gap-2">
              {availableDates.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setSelectedDate(d);
                    setSelectedSlotId("");
                  }}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                    selectedDate === d
                      ? "border-brand-primary bg-brand-primary text-brand-primary-fg"
                      : "border-brand-border bg-brand-bg text-brand-text hover:bg-brand-secondary/50"
                  }`}
                >
                  {formatDateShort(d)}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {daySlots.map((slot) => {
                const selected = chosenSlot?.id === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={!slot.isAvailable}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`rounded-2xl border p-4 text-left flex items-center justify-between transition-all ${
                      !slot.isAvailable
                        ? "border-brand-border bg-brand-surface-muted opacity-55 cursor-not-allowed"
                        : selected
                          ? "border-brand-primary bg-brand-secondary/60 cursor-pointer"
                          : "border-brand-border bg-brand-bg hover:border-brand-border-strong cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-4 w-4 text-brand-accent" />
                      <span className="text-sm font-semibold text-brand-text">
                        {slot.startTime} – {slot.endTime}
                      </span>
                    </div>
                    <Badge tone={slot.isAvailable ? "success" : "neutral"}>
                      {slot.isAvailable ? "Available" : "Reserved"}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6">
            <h2 className="font-editorial text-2xl font-semibold text-brand-text">
              Step 7 · Review Your Booking
            </h2>
            <div className="grid gap-6 md:grid-cols-12">
              <div className="md:col-span-7 space-y-3 rounded-2xl border border-brand-border bg-brand-bg p-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-muted-fg">Designer</span>
                  <span className="font-semibold text-brand-text">
                    {designer.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted-fg">Service</span>
                  <span className="font-semibold text-brand-text">
                    {selectedService?.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted-fg">Occasion</span>
                  <span className="font-semibold text-brand-text">{occasion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted-fg">Appointment Mode</span>
                  <span className="font-semibold text-brand-text">
                    {APPOINTMENT_TYPE_META[appointmentType].label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted-fg">Date & Time</span>
                  <span className="font-semibold text-brand-text">
                    {formatDateShort(chosenSlot?.date ?? selectedDate)} ·{" "}
                    {chosenSlot?.startTime}
                  </span>
                </div>
                <div className="pt-2 border-t border-brand-border">
                  <span className="text-xs text-brand-muted-fg flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-brand-accent" />
                    Location
                  </span>
                  <p className="font-medium text-brand-text mt-0.5">
                    {resolvedAddress}
                  </p>
                </div>
              </div>

              <div className="md:col-span-5 space-y-4 rounded-2xl border border-brand-border bg-brand-bg p-5">
                <h3 className="font-semibold text-sm text-brand-text">
                  Price Breakdown (INR)
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-brand-text-secondary">Service Fee</span>
                    <span>{formatINR(selectedService?.priceInr ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-text-secondary">Travel Fee</span>
                    <span>{formatINR(travelFeeInr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-text-secondary">
                      Platform Care (5%)
                    </span>
                    <span>{formatINR(platformServiceFeeInr)}</span>
                  </div>
                  {discountInr > 0 && (
                    <div className="flex justify-between text-brand-success font-semibold">
                      <span>Coupon ({matchedCoupon?.code})</span>
                      <span>−{formatINR(discountInr)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-brand-border pt-2.5 text-base font-bold text-brand-text">
                    <span>Total</span>
                    <span>{formatINR(totalAmountInr)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                    Promo Code (Try GYDWELCOME)
                  </label>
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-editorial text-2xl font-semibold text-brand-text">
                Step 8 · Payment Preparation (Razorpay Architecture)
              </h2>
              <Badge tone="info">
                <Lock className="h-3 w-3" />
                Sandbox Prep · No Real Charge
              </Badge>
            </div>

            <div className="rounded-2xl border border-brand-info-border bg-brand-info-bg p-4 text-xs leading-relaxed text-brand-info">
              GYD separates booking confirmation from Razorpay payment authorization.
              In this frontend demonstration, no real money is debited and no fake live
              bank confirmation is issued—your selection records a clearly labeled{" "}
              <strong>Sandbox Demo Order</strong> or submits as{" "}
              <strong>Unpaid Pending Review</strong>.
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentMode("DEPOSIT")}
                className={`rounded-2xl border p-5 text-left cursor-pointer ${
                  paymentMode === "DEPOSIT"
                    ? "border-brand-primary bg-brand-secondary/50"
                    : "border-brand-border bg-brand-bg"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                  Recommended · {state.settings.depositPercentage}% Deposit
                </p>
                <p className="font-editorial text-2xl font-semibold text-brand-text mt-1">
                  {formatINR(depositAmountInr)}
                </p>
                <p className="text-xs text-brand-text-secondary mt-1">
                  Remaining {formatINR(totalAmountInr - depositAmountInr)} due after
                  service completion.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("FULL")}
                className={`rounded-2xl border p-5 text-left cursor-pointer ${
                  paymentMode === "FULL"
                    ? "border-brand-primary bg-brand-secondary/50"
                    : "border-brand-border bg-brand-bg"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                  Full Amount
                </p>
                <p className="font-editorial text-2xl font-semibold text-brand-text mt-1">
                  {formatINR(totalAmountInr)}
                </p>
                <p className="text-xs text-brand-text-secondary mt-1">
                  Full escrow hold under Razorpay integration readiness.
                </p>
              </button>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                Select Demo Submission Option
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-xl border border-brand-border bg-brand-bg p-3.5 cursor-pointer">
                  <input
                    type="radio"
                    name="payAction"
                    checked={paymentAction === "SANDBOX_HOLD"}
                    onChange={() => setPaymentAction("SANDBOX_HOLD")}
                    className="mt-1 accent-[var(--color-primary)]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-brand-text">
                      Create Razorpay Sandbox Demo Hold
                    </p>
                    <p className="text-xs text-brand-text-secondary">
                      Logs a test order ID and marks payment as Sandbox Demo.
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 rounded-xl border border-brand-border bg-brand-bg p-3.5 cursor-pointer">
                  <input
                    type="radio"
                    name="payAction"
                    checked={paymentAction === "PAY_LATER"}
                    onChange={() => setPaymentAction("PAY_LATER")}
                    className="mt-1 accent-[var(--color-primary)]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-brand-text">
                      Submit Request First, Pay After Acceptance
                    </p>
                    <p className="text-xs text-brand-text-secondary">
                      Booking enters Pending review with Unpaid payment status.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 9 && createdBooking && (
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-success-bg text-brand-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <Badge tone="success">Booking Request Recorded</Badge>
              <h2 className="font-editorial text-3xl font-semibold text-brand-text">
                Booking Reference: {createdBooking.bookingCode}
              </h2>
              <p className="text-sm text-brand-text-secondary max-w-lg mx-auto">
                Your appointment brief has been sent to {createdBooking.designerName}.
                Booking status and payment status are tracked separately below.
              </p>
            </div>

            <div className="mx-auto max-w-xl rounded-2xl border border-brand-border bg-brand-bg p-5 text-left space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-muted-fg">Designer</span>
                <span className="font-semibold">{createdBooking.designerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted-fg">Service</span>
                <span className="font-semibold">{createdBooking.serviceTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted-fg">Date & Time</span>
                <span className="font-semibold">
                  {formatDateShort(createdBooking.date)} · {createdBooking.startTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted-fg">Booking Status</span>
                <Badge tone="warning">{createdBooking.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted-fg">Payment Status</span>
                <Badge tone="info">{createdBooking.paymentStatus}</Badge>
              </div>
              <div className="pt-2 border-t border-brand-border text-xs text-brand-text-secondary flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-brand-accent shrink-0 mt-0.5" />
                <span>
                  Next step: Check your Customer Dashboard to message{" "}
                  {createdBooking.designerName}, upload extra swatches, or track approval.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="primary" size="lg">
                <Link href="/customer/bookings">View My Bookings</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/customer/messages">Open Studio Chat</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Footer Action Bar for Steps 1–8 */}
        {step < 9 && (
          <div className="mt-8 flex items-center justify-between border-t border-brand-border pt-6">
            <Button
              type="button"
              variant="outline"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            {step < 8 ? (
              <Button type="button" variant="primary" onClick={handleNext}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="accent"
                size="lg"
                disabled={isSubmitting}
                onClick={handleConfirmBooking}
              >
                <CreditCard className="h-4 w-4" />
                {isSubmitting ? "Submitting..." : "Submit Booking Request"}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-brand-muted-fg">
        <ShieldCheck className="h-4 w-4 text-brand-success" />
        <span>
          Protected by slot-concurrency locking & idempotent booking submission.
        </span>
      </div>
    </div>
  );
}

export default function BookDesignerPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-12">
          <Skeleton className="h-96" />
        </div>
      }
    >
      <BookingFlowContent />
    </Suspense>
  );
}
