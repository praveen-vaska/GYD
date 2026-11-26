"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { APPOINTMENT_TYPE_META, SERVICE_CITIES } from "@/constants/gyd";
import { useGydStore } from "@/features/store/gyd-store";
import { AppointmentType } from "@/types";

export default function DesignerSettingsPage() {
  const { pushToast } = useToast();
  const { state, updateDesignerProfileSettings } = useGydStore();
  const did = state.session?.designerId ?? "des-1";
  const designer = state.designers.find((d) => d.id === did) ?? state.designers[0];

  const [title, setTitle] = useState(designer.title);
  const [city, setCity] = useState(designer.city);
  const [radius, setRadius] = useState(String(designer.serviceRadiusKm));
  const [startingPrice, setStartingPrice] = useState(
    String(designer.startingPriceInr)
  );
  const [bio, setBio] = useState(designer.bio);
  const [modes, setModes] = useState<AppointmentType[]>(
    designer.supportedAppointmentTypes
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateDesignerProfileSettings(designer.id, {
      title,
      city,
      serviceRadiusKm: Number(radius) || 30,
      startingPriceInr: Math.max(499, Number(startingPrice) || 1499),
      bio,
      supportedAppointmentTypes: modes,
    });
    pushToast({
      title: "Studio settings saved",
      description: "Public profile updated immediately.",
      type: "success",
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-text">
          Studio Profile & Preferences
        </h1>
        <p className="text-sm text-brand-text-secondary">
          Update your public professional headline, service radius, and supported
          appointment types.
        </p>
      </div>

      <form onSubmit={handleSave} className="gyd-card p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
            Professional Title
          </label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
              Primary City
            </label>
            <Select value={city} onChange={(e) => setCity(e.target.value)}>
              {SERVICE_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
              Service Radius (km)
            </label>
            <Input
              type="number"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
              Starting Price (INR)
            </label>
            <Input
              type="number"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
            Supported Appointment Modes
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(APPOINTMENT_TYPE_META) as AppointmentType[]).map(
              (m) => {
                const active = modes.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() =>
                      setModes((prev) =>
                        prev.includes(m)
                          ? prev.filter((x) => x !== m)
                          : [...prev, m]
                      )
                    }
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold border cursor-pointer ${
                      active
                        ? "border-brand-primary bg-brand-primary text-brand-primary-fg"
                        : "border-brand-border bg-brand-bg text-brand-text"
                    }`}
                  >
                    {APPOINTMENT_TYPE_META[m].label}
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
            Bio
          </label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
          />
        </div>

        <Button type="submit" variant="primary">
          Save Studio Settings
        </Button>
      </form>
    </div>
  );
}
