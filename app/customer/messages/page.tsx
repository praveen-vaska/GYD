"use client";

import React from "react";
import { MessagingPanel } from "@/components/messaging/messaging-panel";

export default function CustomerMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-text">
          Studio Messages
        </h1>
        <p className="text-sm text-brand-text-secondary">
          Collaborate directly with your designers, share fabric references, and
          coordinate appointments.
        </p>
      </div>
      <MessagingPanel perspective="CUSTOMER" />
    </div>
  );
}
