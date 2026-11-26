import React from "react";
import { Badge } from "@/components/ui/badge";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-6">
      <Badge tone="primary">Marketplace Policies</Badge>
      <h1 className="font-editorial text-4xl font-semibold text-brand-text">
        Terms & Conditions
      </h1>
      <div className="gyd-card p-6 sm:p-8 space-y-4 text-sm leading-relaxed text-brand-text-secondary">
        <p>
          GYD connects clients with independent stylists, bridal couturiers,
          makeup artists, celebration decorators, and interior consultants across
          India.
        </p>
        <p>
          Bookings are subject to designer availability and conflict checks.
          Cancellations submitted at least 48 hours prior to an appointment qualify
          for full policy refunds; cancellations inside 48 hours are eligible for
          a 50% partial refund.
        </p>
        <p>
          All Razorpay interactions shown in this frontend build operate in clearly
          labeled sandbox demonstration mode without processing real financial
          transactions.
        </p>
      </div>
    </div>
  );
}
