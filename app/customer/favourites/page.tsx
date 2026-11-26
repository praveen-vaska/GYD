"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { DesignerCard } from "@/components/designers/designer-card";
import { EmptyState } from "@/components/ui/feedback";
import { useGydStore } from "@/features/store/gyd-store";

export default function CustomerFavouritesPage() {
  const router = useRouter();
  const { state, getVisibleDesigners } = useGydStore();
  const uid = state.session?.userId ?? "usr-cust-1";
  const favIds = new Set(
    state.favourites.filter((f) => f.customerId === uid).map((f) => f.designerId)
  );
  const savedDesigners = getVisibleDesigners().filter((d) => favIds.has(d.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-text">
          Favourite Designers
        </h1>
        <p className="text-sm text-brand-text-secondary">
          Shortlisted stylists, bridal artists, and interior experts ready to book.
        </p>
      </div>

      {savedDesigners.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart icon on any designer profile to compare and save them here."
          actionLabel="Explore Designers"
          onAction={() => router.push("/explore")}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {savedDesigners.map((d, idx) => (
            <DesignerCard key={d.id} designer={d} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
