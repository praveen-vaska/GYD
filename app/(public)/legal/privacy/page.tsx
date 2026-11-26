import React from "react";
import { Badge } from "@/components/ui/badge";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-6">
      <Badge tone="primary">Privacy Architecture</Badge>
      <h1 className="font-editorial text-4xl font-semibold text-brand-text">
        Privacy Policy
      </h1>
      <div className="gyd-card p-6 sm:p-8 space-y-4 text-sm leading-relaxed text-brand-text-secondary">
        <p>
          GYD – Get Your Designer treats customer addresses, mobile numbers,
          identity verification documents, and personal wardrobe references as
          strictly scoped data.
        </p>
        <p>
          Designer public profiles intentionally omit private telephone numbers and
          street addresses. Exact visit addresses are shared with an assigned
          designer only after booking acceptance and confirmation.
        </p>
        <p>
          In the current frontend demonstration release, entries are stored locally
          in your browser session for evaluation purposes.
        </p>
      </div>
    </div>
  );
}
