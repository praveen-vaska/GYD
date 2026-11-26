"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { OCCASION_OPTIONS, SERVICE_CITIES } from "@/constants/gyd";
import { useGydStore } from "@/features/store/gyd-store";

const PORTFOLIO_IMAGE_CHOICES = [
  "/images/portfolio/portfolio-01.jpg",
  "/images/portfolio/portfolio-02.jpg",
  "/images/portfolio/portfolio-03.jpg",
  "/images/portfolio/portfolio-04.jpg",
  "/images/portfolio/portfolio-05.jpg",
  "/images/occasions/weddings.jpg",
  "/images/occasions/engagements.jpg",
];

export default function DesignerPortfolioPage() {
  const { pushToast } = useToast();
  const { state, addPortfolioProject, deletePortfolioProject } = useGydStore();
  const did = state.session?.designerId ?? "des-1";
  const myPortfolios = state.portfolios.filter((p) => p.designerId === did);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [categoryName, setCategoryName] = useState("Wedding Styling");
  const [occasion, setOccasion] = useState("Wedding");
  const [city, setCity] = useState("Hyderabad");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState(
    PORTFOLIO_IMAGE_CHOICES[0]
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 4 || description.trim().length < 15) {
      pushToast({
        title: "Add project title and story",
        type: "warning",
      });
      return;
    }
    addPortfolioProject({
      title,
      categoryName,
      occasion,
      city,
      description,
      coverImageUrl,
    });
    setTitle("");
    setDescription("");
    setOpen(false);
    pushToast({
      title: "Portfolio project added",
      description: "Live on your public designer profile.",
      type: "success",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-brand-text">
            Portfolio Management
          </h1>
          <p className="text-sm text-brand-text-secondary">
            Curate editorial collections and case studies for prospective
            clients.
          </p>
        </div>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Portfolio Project
        </Button>
      </div>

      {myPortfolios.length === 0 ? (
        <EmptyState
          title="No portfolio collections yet"
          description="Showcase past weddings, wardrobe transformations, or interior shoots."
          actionLabel="Add First Project"
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {myPortfolios.map((port) => (
            <article key={port.id} className="gyd-card overflow-hidden flex flex-col">
              <div className="relative aspect-[4/3] bg-brand-secondary">
                <Image
                  src={port.coverImageUrl}
                  alt={port.title}
                  fill
                  sizes="400px"
                  className="object-cover"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone="accent">{port.occasion}</Badge>
                    <span className="text-xs text-brand-muted-fg">{port.city}</span>
                  </div>
                  <h2 className="font-editorial text-lg font-semibold text-brand-text">
                    {port.title}
                  </h2>
                  <p className="text-xs text-brand-text-secondary line-clamp-2">
                    {port.description}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-brand-error self-end"
                  onClick={() => {
                    deletePortfolioProject(port.id);
                    pushToast({ title: "Project removed", type: "info" });
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
        open={open}
        onClose={() => setOpen(false)}
        title="Add Portfolio Collection"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project Title (e.g. Banjara Hills Bridal Reception)"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Select
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            >
              {state.categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select value={occasion} onChange={(e) => setOccasion(e.target.value)}>
              {OCCASION_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
            <Select value={city} onChange={(e) => setCity(e.target.value)}>
              {SERVICE_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <Select
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
          >
            {PORTFOLIO_IMAGE_CHOICES.map((url, idx) => (
              <option key={url} value={url}>
                Editorial Lookbook Preset #{idx + 1} ({url.split("/").pop()})
              </option>
            ))}
          </Select>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the brief, colour palette, and styling execution..."
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Publish to Portfolio
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
