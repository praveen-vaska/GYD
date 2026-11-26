"use client";

import React from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { useGydStore } from "@/features/store/gyd-store";
import { formatDateShort } from "@/lib/utils";

export default function CustomerNotificationsPage() {
  const { state, markNotificationRead, markAllNotificationsRead } =
    useGydStore();
  const list = state.notifications.filter((n) => n.role === "CUSTOMER");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-brand-text">
            Notifications
          </h1>
          <p className="text-sm text-brand-text-secondary">
            Booking approvals, payment confirmations, reminders & message alerts.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={markAllNotificationsRead}
        >
          <CheckCheck className="h-4 w-4" />
          Mark All Read
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="New booking alerts and studio reminders appear here."
        />
      ) : (
        <div className="space-y-3">
          {list.map((n) => (
            <div
              key={n.id}
              className={`gyd-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                !n.isRead ? "border-brand-primary/50 bg-brand-secondary/30" : ""
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-brand-text">
                    {n.title}
                  </span>
                  {!n.isRead && <Badge tone="accent">New</Badge>}
                </div>
                <p className="text-xs text-brand-text-secondary">{n.message}</p>
                <p className="text-[11px] text-brand-muted-fg">
                  {formatDateShort(n.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!n.isRead && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markNotificationRead(n.id)}
                  >
                    Mark Read
                  </Button>
                )}
                <Button asChild size="sm" variant="outline">
                  <Link href={n.linkHref}>Open</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
