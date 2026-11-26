"use client";

import React, { useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { useTheme } from "@/components/common/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { SERVICE_CITIES } from "@/constants/gyd";
import { useGydStore } from "@/features/store/gyd-store";

export default function CustomerProfilePage() {
  const { theme, setTheme } = useTheme();
  const { pushToast } = useToast();
  const { state, updateCustomerProfile, addAddress, deleteAddress } =
    useGydStore();

  const currentUser =
    state.users.find((u) => u.id === state.session?.userId) ?? state.users[0];
  const myAddresses = state.addresses.filter(
    (a) => a.userId === currentUser.id
  );

  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [city, setCity] = useState(currentUser.city);

  const [addrLabel, setAddrLabel] = useState<"Home" | "Event Venue" | "Office" | "Other">("Home");
  const [line1, setLine1] = useState("");
  const [addrCity, setAddrCity] = useState(currentUser.city);
  const [pincode, setPincode] = useState("");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomerProfile({ name, phone, city });
    pushToast({
      title: "Profile updated",
      description: "Saved your personal details.",
      type: "success",
    });
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (line1.trim().length < 5 || !/^\d{6}$/.test(pincode)) {
      pushToast({
        title: "Invalid address",
        description: "Provide street address and a valid 6-digit PIN code.",
        type: "warning",
      });
      return;
    }
    addAddress({
      label: addrLabel,
      line1,
      city: addrCity,
      state: "Telangana",
      pincode,
      isDefault: myAddresses.length === 0,
    });
    setLine1("");
    setPincode("");
    pushToast({
      title: "Address saved",
      type: "success",
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-text">
          My Profile, Addresses & Settings
        </h1>
        <p className="text-sm text-brand-text-secondary">
          Keep your contact preferences and styling locations ready for quick
          checkout.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="gyd-card p-6 space-y-4">
        <h2 className="font-editorial text-xl font-semibold text-brand-text">
          Personal Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
              Full Name
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
              Email
            </label>
            <Input value={currentUser.email} disabled />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
              Phone Number
            </label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
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
        </div>
        <Button type="submit" variant="primary">
          Save Profile
        </Button>
      </form>

      {/* Saved Addresses */}
      <section className="gyd-card p-6 space-y-5">
        <h2 className="font-editorial text-xl font-semibold text-brand-text">
          Saved Addresses ({myAddresses.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {myAddresses.map((addr) => (
            <div
              key={addr.id}
              className="rounded-2xl border border-brand-border bg-brand-bg p-4 flex items-start justify-between gap-2"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-accent" />
                  <span className="font-bold text-sm text-brand-text">
                    {addr.label}
                  </span>
                  {addr.isDefault && <Badge tone="primary">Default</Badge>}
                </div>
                <p className="text-xs text-brand-text-secondary">
                  {addr.line1}, {addr.city} – {addr.pincode}
                </p>
              </div>
              <button
                type="button"
                aria-label="Delete address"
                onClick={() => deleteAddress(addr.id)}
                className="text-brand-muted hover:text-brand-error p-1 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleAddAddress}
          className="border-t border-brand-border pt-4 grid gap-3 sm:grid-cols-4 items-end"
        >
          <Select
            value={addrLabel}
            onChange={(e) => setAddrLabel(e.target.value as typeof addrLabel)}
          >
            <option value="Home">Home</option>
            <option value="Event Venue">Event Venue</option>
            <option value="Office">Office</option>
            <option value="Other">Other</option>
          </Select>
          <Input
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="Street / Apartment / Venue"
            className="sm:col-span-2"
          />
          <div className="flex gap-2">
            <Input
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="PIN (6 digits)"
            />
            <Button type="submit" variant="accent" size="icon" aria-label="Add address">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Select
            value={addrCity}
            onChange={(e) => setAddrCity(e.target.value)}
            className="sm:col-span-2"
          >
            {SERVICE_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </form>
      </section>

      {/* Theme & Preferences */}
      <section className="gyd-card p-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-editorial text-xl font-semibold text-brand-text">
            Appearance Theme
          </h2>
          <p className="text-xs text-brand-text-secondary">
            Switch between Lavender Mist (Light) and Deep Plum Atelier (Dark).
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={theme === "light" ? "primary" : "outline"}
            size="sm"
            onClick={() => setTheme("light")}
          >
            Light
          </Button>
          <Button
            variant={theme === "dark" ? "primary" : "outline"}
            size="sm"
            onClick={() => setTheme("dark")}
          >
            Dark
          </Button>
        </div>
      </section>
    </div>
  );
}
