"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useGydStore } from "@/features/store/gyd-store";

export default function AdminCmsPage() {
  const { pushToast } = useToast();
  const { state, updateCmsContent } = useGydStore();

  const [heroHeadline, setHeroHeadline] = useState(state.cms.heroHeadline);
  const [heroSubheadline, setHeroSubheadline] = useState(
    state.cms.heroSubheadline
  );
  const [promoBannerText, setPromoBannerText] = useState(
    state.cms.promoBannerText
  );
  const [promoBannerActive, setPromoBannerActive] = useState(
    state.cms.promoBannerActive
  );
  const [becomeHeadline, setBecomeHeadline] = useState(
    state.cms.becomeDesignerHeadline
  );
  const [footerTagline, setFooterTagline] = useState(state.cms.footerTagline);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCmsContent({
      heroHeadline,
      heroSubheadline,
      promoBannerText,
      promoBannerActive,
      becomeDesignerHeadline: becomeHeadline,
      footerTagline,
    });
    pushToast({
      title: "CMS changes published",
      description: "Homepage banners, headlines & footer updated live.",
      type: "success",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-text">
          CMS & Editorial Content
        </h1>
        <p className="text-sm text-brand-text-secondary">
          Manage homepage banners, promotional announcements, partner CTA copy,
          and footer details dynamically.
        </p>
      </div>

      <form onSubmit={handleSave} className="gyd-card p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
            Hero Headline
          </label>
          <Input
            value={heroHeadline}
            onChange={(e) => setHeroHeadline(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
            Hero Description
          </label>
          <Textarea
            value={heroSubheadline}
            onChange={(e) => setHeroSubheadline(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2 rounded-2xl border border-brand-border bg-brand-bg p-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-brand-text cursor-pointer">
            <input
              type="checkbox"
              checked={promoBannerActive}
              onChange={(e) => setPromoBannerActive(e.target.checked)}
              className="accent-[var(--color-primary)]"
            />
            Show Top Promotional Banner
          </label>
          <Input
            value={promoBannerText}
            onChange={(e) => setPromoBannerText(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
            Become a Designer Headline
          </label>
          <Input
            value={becomeHeadline}
            onChange={(e) => setBecomeHeadline(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
            Footer Description
          </label>
          <Textarea
            value={footerTagline}
            onChange={(e) => setFooterTagline(e.target.value)}
            rows={2}
          />
        </div>

        <Button type="submit" variant="primary">
          Save & Publish CMS Updates
        </Button>
      </form>
    </div>
  );
}
