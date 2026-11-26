"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/navigation/location-search";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { APPOINTMENT_TYPE_META } from "@/constants/gyd";
import { useGydStore } from "@/features/store/gyd-store";
import { PlaceSuggestion } from "@/lib/location/nearby";
import { AppointmentType, DesignerVerification } from "@/types";

export default function BecomeDesignerPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const { state, registerDesigner } = useGydStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState<string>("Hyderabad");
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);

  const [title, setTitle] = useState("");
  const [experienceYears, setExperienceYears] = useState("4");
  const [startingPriceInr, setStartingPriceInr] = useState("1999");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([
    "cat-wedding-styling",
  ]);
  const [skillsText, setSkillsText] = useState(
    "Bridal Styling, Colour Analysis, Shopping Assistance"
  );
  const [bio, setBio] = useState("");
  const [supportedModes, setSupportedModes] = useState<AppointmentType[]>([
    "ONLINE_CONSULTATION",
    "STUDIO_APPOINTMENT",
  ]);

  const [documentType, setDocumentType] =
    useState<DesignerVerification["documentType"]>("Aadhaar / Govt ID");
  const [documentRefMasked, setDocumentRefMasked] = useState("XXXX-XXXX-7412");
  const [portfolioSampleName, setPortfolioSampleName] = useState(
    "editorial-lookbook-2026.pdf"
  );

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const toggleMode = (mode: AppointmentType) => {
    setSupportedModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !title.trim() || bio.trim().length < 25) {
      pushToast({
        title: "Complete your studio profile",
        description:
          "Ensure name, email, professional title, and a 25+ character bio are filled.",
        type: "warning",
      });
      return;
    }

    const res = registerDesigner({
      name,
      email,
      phone: phone || "+91 98000 00000",
      city,
      neighborhood:
        selectedPlace?.label && selectedPlace.label !== city
          ? selectedPlace.label
          : undefined,
      latitude: selectedPlace?.lat,
      longitude: selectedPlace?.lng,
      title,
      experienceYears: Number(experienceYears) || 2,
      startingPriceInr: Math.max(499, Number(startingPriceInr) || 1499),
      categoryIds:
        selectedCategoryIds.length > 0
          ? selectedCategoryIds
          : ["cat-personal-styling"],
      skills: skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      bio,
      supportedAppointmentTypes: supportedModes,
      documentType,
      documentRefMasked,
    });

    if (!res.ok) {
      pushToast({
        title: "Registration could not complete",
        description: res.error,
        type: "error",
      });
      return;
    }

    pushToast({
      title: "Studio Application Submitted",
      description: state.settings.requireDesignerVerification
        ? "Your profile is queued for Admin verification. Entering Designer Studio."
        : "Your designer studio is active!",
      type: "success",
    });
    router.push("/designer/dashboard");
  };

  return (
    <div className="gyd-container py-12 space-y-12">
      <section className="grid gap-10 lg:grid-cols-12 items-center">
        <div className="lg:col-span-6 space-y-5">
          <Badge tone="accent">GYD Partner Studios</Badge>
          <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-brand-text leading-tight">
            {state.cms.becomeDesignerHeadline}
          </h1>
          <p className="text-base text-brand-text-secondary leading-relaxed">
            {state.cms.becomeDesignerSubheadline} Set your own INR packages, manage
            slot availability, showcase editorial portfolios, and track transparent
            payouts.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 pt-2">
            <div className="gyd-card p-4">
              <Briefcase className="h-5 w-5 text-brand-accent mb-2" />
              <p className="text-sm font-bold text-brand-text">Custom Packages</p>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Online, Home, Studio & Shopping fees
              </p>
            </div>
            <div className="gyd-card p-4">
              <TrendingUp className="h-5 w-5 text-brand-primary mb-2" />
              <p className="text-sm font-bold text-brand-text">Verified Discovery</p>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Matched by occasion & city
              </p>
            </div>
            <div className="gyd-card p-4">
              <ShieldCheck className="h-5 w-5 text-brand-success mb-2" />
              <p className="text-sm font-bold text-brand-text">Conflict-Free Slots</p>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Automatic double-booking protection
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="relative aspect-[16/11] overflow-hidden rounded-[22px] border border-brand-border shadow-xl">
            <Image
              src="/images/hero/become-designer.jpg"
              alt="Designer working on creative textiles"
              fill
              sizes="(max-width: 1024px) 100vw, 600px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Multi-Step Designer Onboarding Form */}
      <section className="gyd-panel p-6 sm:p-10 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-6 mb-6">
          <div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-brand-text">
              Designer Application & Onboarding
            </h2>
            <p className="text-xs sm:text-sm text-brand-text-secondary mt-1">
              {state.settings.requireDesignerVerification
                ? "Verification is active: new studios remain pending until approved by a GYD Admin."
                : "Instant onboarding is active."}
            </p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setStep(num as 1 | 2 | 3)}
                className={`h-9 px-3.5 rounded-xl text-xs font-bold cursor-pointer ${
                  step === num
                    ? "bg-brand-primary text-brand-primary-fg"
                    : "bg-brand-bg text-brand-muted-fg border border-brand-border"
                }`}
              >
                Step {num}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Full Name
                </label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rhea Krishnan"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Studio Email
                </label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rhea@atelier.in"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Mobile Number
                </label>
                <Input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98480 00000"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Password (Demo Account)
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Studio Location (City, Town, or Village)
                </label>
                <LocationPicker
                  compact={false}
                  valueLabel={selectedPlace?.label ?? city}
                  onSelectPlace={(place) => {
                    setSelectedPlace(place);
                    setCity(place.city);
                  }}
                  placeholder="Search city, town, area, or village..."
                />
                <p className="text-[11px] text-brand-muted-fg">
                  Enter any city, town, or village—customers searching nearby or surrounding areas can discover and book your studio.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                    Professional Title
                  </label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Bridal & Heritage Silk Stylist"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                    Years Experience
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                    Starting Consultation Price (INR)
                  </label>
                  <Input
                    type="number"
                    min={499}
                    value={startingPriceInr}
                    onChange={(e) => setStartingPriceInr(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                    Core Skills (comma-separated)
                  </label>
                  <Input
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Service Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {state.categories
                    .filter((c) => c.isActive)
                    .map((cat) => {
                      const active = selectedCategoryIds.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-semibold border cursor-pointer ${
                            active
                              ? "border-brand-primary bg-brand-primary text-brand-primary-fg"
                              : "border-brand-border bg-brand-bg text-brand-text"
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Appointment Modes Offered
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(APPOINTMENT_TYPE_META) as AppointmentType[]).map(
                    (mode) => {
                      const active = supportedModes.includes(mode);
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => toggleMode(mode)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-semibold border cursor-pointer ${
                            active
                              ? "border-brand-accent bg-brand-accent text-white"
                              : "border-brand-border bg-brand-bg text-brand-text"
                          }`}
                        >
                          {APPOINTMENT_TYPE_META[mode].label}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Studio Bio & Approach
                </label>
                <Textarea
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your background, design philosophy, and typical client transformations..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-brand-secondary/50 p-4 flex items-start gap-3">
                <BadgeCheck className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Verification documents are visible strictly to authorized GYD Admins
                  during onboarding review and are never exposed publicly.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                    Verification Document Type
                  </label>
                  <Select
                    value={documentType}
                    onChange={(e) =>
                      setDocumentType(
                        e.target.value as DesignerVerification["documentType"]
                      )
                    }
                  >
                    <option value="Aadhaar / Govt ID">Aadhaar / Govt ID</option>
                    <option value="Design Studio Registration">
                      Design Studio Registration
                    </option>
                    <option value="Portfolio Credential">
                      Portfolio Credential
                    </option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                    Masked ID / Reference Number
                  </label>
                  <Input
                    value={documentRefMasked}
                    onChange={(e) => setDocumentRefMasked(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Sample Portfolio File Reference
                </label>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setPortfolioSampleName(f.name);
                  }}
                />
                <p className="text-xs text-brand-muted-fg">
                  Selected: {portfolioSampleName}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-brand-border">
            <Button
              type="button"
              variant="outline"
              disabled={step === 1}
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
            >
              Previous
            </Button>

            {step < 3 ? (
              <Button
                key="step-continue-btn"
                type="button"
                variant="primary"
                onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button key="step-submit-btn" type="submit" variant="accent" size="lg">
                <CheckCircle2 className="h-4 w-4" />
                Submit Studio Application
              </Button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
