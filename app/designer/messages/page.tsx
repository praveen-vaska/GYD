"use client";

import React from "react";
import { MessagingPanel } from "@/components/messaging/messaging-panel";

export default function DesignerMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-text">
          Client Messages
        </h1>
        <p className="text-sm text-brand-text-secondary">
          Review client moodboards, confirm fitting times, and share lookbook
          swatches.
        </p>
      </div>
      <MessagingPanel perspective="DESIGNER" />
    </div>
  );
}
