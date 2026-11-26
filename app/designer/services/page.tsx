"use client";

import React, { useState } from "react";
import { Edit3, Plus, Power, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { APPOINTMENT_TYPE_META, SERVICE_CITIES } from "@/constants/gyd";
import { useGydStore } from "@/features/store/gyd-store";
import { formatINR } from "@/lib/utils";
import { AppointmentType, Service } from "@/types";

export default function DesignerServicesPage() {
  const { pushToast } = useToast();
  const { state, saveService, toggleServiceActive, deleteService } =
    useGydStore();

  const did = state.session?.designerId ?? "des-1";
  const designer = state.designers.find((d) => d.id === did) ?? state.designers[0];
  const myServices = state.services.filter((s) => s.designerId === designer.id);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(
    state.categories[0]?.id ?? "cat-wedding-styling"
  );
  const [subcategoryName, setSubcategoryName] = useState("Wedding Styling");
  const [description, setDescription] = useState("");
  const [priceInr, setPriceInr] = useState("2499");
  const [durationMinutes, setDurationMinutes] = useState("90");
  const [travelChargeInr, setTravelChargeInr] = useState("300");
  const [modes, setModes] = useState<AppointmentType[]>([
    "ONLINE_CONSULTATION",
    "HOME_VISIT",
  ]);
  const [city, setCity] = useState(designer.city);

  const openCreate = () => {
    setEditingId(undefined);
    setTitle("");
    setDescription("");
    setPriceInr("2499");
    setDurationMinutes("90");
    setTravelChargeInr("300");
    setModalOpen(true);
  };

  const openEdit = (srv: Service) => {
    setEditingId(srv.id);
    setTitle(srv.title);
    setCategoryId(srv.categoryId);
    setSubcategoryName(srv.subcategoryName);
    setDescription(srv.description);
    setPriceInr(String(srv.priceInr));
    setDurationMinutes(String(srv.durationMinutes));
    setTravelChargeInr(String(srv.travelChargeInr));
    setModes(srv.appointmentTypes);
    setCity(srv.serviceCities[0] ?? designer.city);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 4 || description.trim().length < 15) {
      pushToast({
        title: "Complete service details",
        description: "Provide a clear title and description (15+ chars).",
        type: "warning",
      });
      return;
    }
    const basePrice = Math.max(499, Number(priceInr) || 1499);
    const matchedCat = state.categories.find((c) => c.id === categoryId);
    saveService({
      id: editingId,
      categoryId,
      subcategoryName: subcategoryName || matchedCat?.name || "Styling",
      title,
      description,
      priceInr: basePrice,
      durationMinutes: Number(durationMinutes) || 90,
      appointmentTypes: modes.length > 0 ? modes : ["ONLINE_CONSULTATION"],
      serviceCities: [city],
      travelChargeInr: Number(travelChargeInr) || 0,
      imageUrl: matchedCat?.imageUrl ?? "/images/categories/wedding-styling.jpg",
      isActive: true,
      packages: [
        {
          id: `pkg-${Date.now()}-1`,
          serviceId: editingId ?? "new",
          name: "Standard Session",
          description: "Core styling & lookbook direction",
          priceInr: basePrice,
          deliverables: ["Lookbook summary", "Color guide"],
          durationLabel: `${durationMinutes} mins`,
        },
        {
          id: `pkg-${Date.now()}-2`,
          serviceId: editingId ?? "new",
          name: "Full Atelier Package",
          description: "Extended sourcing + follow-up fitting check",
          priceInr: Math.round(basePrice * 1.6),
          deliverables: ["Complete sourcing", "Follow-up fitting", "Accessory checklist"],
          durationLabel: "Multi-session",
        },
      ],
    });
    setModalOpen(false);
    pushToast({
      title: editingId ? "Service updated" : "Service added",
      type: "success",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-brand-text">
            Service Management
          </h1>
          <p className="text-sm text-brand-text-secondary">
            Manage your packages, pricing (INR), session durations, visit modes,
            and travel charges.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add New Service
        </Button>
      </div>

      {myServices.length === 0 ? (
        <EmptyState
          title="No services configured yet"
          description="Add your first consultation or full styling package so clients can book you."
          actionLabel="Create First Service"
          onAction={openCreate}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {myServices.map((srv) => (
            <article key={srv.id} className="gyd-card p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="accent">{srv.subcategoryName}</Badge>
                  <Badge tone={srv.isActive ? "success" : "neutral"}>
                    {srv.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
                <h2 className="font-editorial text-xl font-semibold text-brand-text">
                  {srv.title}
                </h2>
                <p className="text-xs text-brand-text-secondary line-clamp-2">
                  {srv.description}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-brand-muted-fg pt-1">
                  <span className="font-bold text-brand-text">
                    {formatINR(srv.priceInr)}
                  </span>
                  <span>·</span>
                  <span>{srv.durationMinutes} mins</span>
                  <span>·</span>
                  <span>Travel: {formatINR(srv.travelChargeInr)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-brand-border pt-3">
                <Button size="sm" variant="outline" onClick={() => openEdit(srv)}>
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleServiceActive(srv.id)}
                >
                  <Power className="h-3.5 w-3.5" />
                  {srv.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-brand-error"
                  onClick={() => {
                    deleteService(srv.id);
                    pushToast({ title: "Service deleted", type: "info" });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Service" : "Add New Service"}
        maxWidthClassName="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
              Service Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bridal Trousseau Curation"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                Category
              </label>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                Subcategory
              </label>
              <Input
                value={subcategoryName}
                onChange={(e) => setSubcategoryName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                Price (INR)
              </label>
              <Input
                type="number"
                value={priceInr}
                onChange={(e) => setPriceInr(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                Duration (mins)
              </label>
              <Input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                Travel Fee (INR)
              </label>
              <Input
                type="number"
                value={travelChargeInr}
                onChange={(e) => setTravelChargeInr(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
              Primary Service City
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
              Appointment Modes
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
                      className={`rounded-xl px-2.5 py-1 text-xs font-semibold border cursor-pointer ${
                        active
                          ? "border-brand-primary bg-brand-primary text-brand-primary-fg"
                          : "border-brand-border bg-brand-bg text-brand-text"
                      }`}
                    >
                      {APPOINTMENT_TYPE_META[m].shortLabel}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Service
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
