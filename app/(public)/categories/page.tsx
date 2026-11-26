"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Layers, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { useGydStore } from "@/features/store/gyd-store";

export default function CategoriesPage() {
  const { state } = useGydStore();
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");

  const activeCategories = [...state.categories]
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const groups = ["All", ...Array.from(new Set(activeCategories.map((c) => c.groupName)))];

  const filtered = activeCategories.filter((cat) => {
    if (selectedGroup !== "All" && cat.groupName !== selectedGroup) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      cat.name.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q) ||
      cat.subcategories.some((s) => s.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="gyd-container py-10 space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <Badge tone="primary">Dynamic Marketplace Directory</Badge>
          <h1 className="font-editorial text-3xl sm:text-5xl font-semibold text-brand-text">
            Service Categories & Specialties
          </h1>
          <p className="text-sm sm:text-base text-brand-text-secondary">
            From bridal trousseaus and groom bandhgalas to celebration florals and
            home workspace makeovers. Categories are managed live from the Admin
            console.
          </p>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted-fg" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search any service or specialty..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Group Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {groups.map((grp) => (
          <button
            key={grp}
            type="button"
            onClick={() => setSelectedGroup(grp)}
            className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              selectedGroup === grp
                ? "bg-brand-primary text-brand-primary-fg shadow-sm"
                : "bg-brand-surface border border-brand-border text-brand-text-secondary hover:bg-brand-surface-muted"
            }`}
          >
            {grp}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No matching categories"
          description="Try another keyword or clear your discipline filter."
          actionLabel="Show All Categories"
          onAction={() => {
            setSearch("");
            setSelectedGroup("All");
          }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((cat) => {
            const matchingDesigners = state.designers.filter(
              (d) => d.approvalStatus === "APPROVED" && d.categoryIds.includes(cat.id)
            ).length;
            return (
              <article key={cat.id} className="gyd-card overflow-hidden flex flex-col">
                <div className="relative h-52 bg-brand-secondary">
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between text-white">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-accent">
                        {cat.groupName}
                      </span>
                      <h2 className="font-editorial text-2xl font-semibold">
                        {cat.name}
                      </h2>
                    </div>
                    <Badge className="bg-white/90 text-brand-primary border-0">
                      {matchingDesigners} designers
                    </Badge>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <p className="text-sm text-brand-text-secondary leading-relaxed">
                      {cat.description}
                    </p>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg mb-2.5">
                        Included Subcategories
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cat.subcategories
                          .filter((s) => s.isActive)
                          .map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/explore?category=${encodeURIComponent(cat.name)}&q=${encodeURIComponent(sub.name)}`}
                              className="rounded-xl border border-brand-border bg-brand-bg px-3 py-1.5 text-xs font-semibold text-brand-text hover:border-brand-primary hover:bg-brand-secondary/60 transition-colors"
                            >
                              {sub.name}
                            </Link>
                          ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-brand-border flex items-center justify-between">
                    <span className="text-xs text-brand-muted-fg">
                      Verified stylists across India
                    </span>
                    <Button asChild variant="primary" size="sm">
                      <Link href={`/explore?category=${encodeURIComponent(cat.name)}`}>
                        Find {cat.name} Pros
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
