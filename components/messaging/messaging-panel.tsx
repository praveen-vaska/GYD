"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CheckCheck, ImagePlus, MessageSquare, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useGydStore } from "@/features/store/gyd-store";
import { formatDateShort } from "@/lib/utils";
import { UserRole } from "@/types";

export function MessagingPanel({ perspective }: { perspective: UserRole }) {
  const { state, sendMessage } = useGydStore();
  const { pushToast } = useToast();

  const uid = state.session?.userId ?? "usr-cust-1";
  const did = state.session?.designerId ?? "des-1";

  const conversations = state.conversations
    .filter((c) =>
      perspective === "DESIGNER" ? c.designerId === did : c.customerId === uid
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const [activeConvId, setActiveConvId] = useState<string>(
    conversations[0]?.id ?? ""
  );
  const [draft, setDraft] = useState("");
  const [attachmentName, setAttachmentName] = useState<string>("");

  const activeConv =
    conversations.find((c) => c.id === activeConvId) ?? conversations[0];
  const threadMessages = state.messages.filter(
    (m) => m.conversationId === activeConv?.id
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv) return;
    const res = sendMessage(
      activeConv.id,
      draft,
      attachmentName
        ? {
            name: attachmentName,
            url: "/images/occasions/weddings.jpg",
          }
        : undefined
    );
    if (!res.ok) {
      pushToast({
        title: "Cannot send message",
        description: res.error,
        type: "warning",
      });
      return;
    }
    setDraft("");
    setAttachmentName("");
  };

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No studio conversations yet"
        description="Conversations open automatically when you submit a booking or send an enquiry to a designer."
      />
    );
  }

  return (
    <div className="gyd-panel overflow-hidden grid md:grid-cols-12 min-h-[540px]">
      {/* Conversation List */}
      <aside className="md:col-span-4 border-b md:border-b-0 md:border-r border-brand-border bg-brand-surface-muted/40 p-3 space-y-2 max-h-[300px] md:max-h-[600px] overflow-y-auto">
        <p className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
          Active Threads ({conversations.length})
        </p>
        {conversations.map((conv) => {
          const isSelected = conv.id === activeConv?.id;
          const peerName =
            perspective === "DESIGNER" ? conv.customerName : conv.designerName;
          const peerAvatar =
            perspective === "DESIGNER" ? conv.customerAvatar : conv.designerAvatar;
          const unread =
            perspective === "DESIGNER"
              ? conv.unreadCountDesigner
              : conv.unreadCountCustomer;

          return (
            <button
              key={conv.id}
              type="button"
              onClick={() => setActiveConvId(conv.id)}
              className={`w-full rounded-2xl p-3 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                isSelected
                  ? "bg-brand-primary text-brand-primary-fg shadow-sm"
                  : "bg-brand-surface hover:bg-brand-secondary/50 text-brand-text"
              }`}
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={peerAvatar}
                  alt={peerName}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold truncate">{peerName}</p>
                  {unread > 0 && !isSelected && (
                    <span className="rounded-full bg-brand-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </div>
                <p
                  className={`text-[11px] font-semibold truncate ${
                    isSelected ? "text-brand-accent" : "text-brand-muted-fg"
                  }`}
                >
                  {conv.subject}
                </p>
                <p
                  className={`text-xs truncate mt-0.5 ${
                    isSelected
                      ? "text-brand-primary-fg/80"
                      : "text-brand-text-secondary"
                  }`}
                >
                  {conv.lastMessagePreview}
                </p>
              </div>
            </button>
          );
        })}
      </aside>

      {/* Active Chat Panel */}
      <div className="md:col-span-8 flex flex-col justify-between bg-brand-surface">
        {activeConv && (
          <>
            <div className="border-b border-brand-border px-5 py-3.5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-editorial text-lg font-semibold text-brand-text">
                  {perspective === "DESIGNER"
                    ? activeConv.customerName
                    : activeConv.designerName}
                </h2>
                <p className="text-xs text-brand-muted-fg">
                  {activeConv.subject}
                </p>
              </div>
              {activeConv.bookingCode && (
                <Badge tone="primary">{activeConv.bookingCode}</Badge>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[420px]">
              {threadMessages.map((msg) => {
                const isSelf =
                  (perspective === "DESIGNER" && msg.senderRole === "DESIGNER") ||
                  (perspective !== "DESIGNER" && msg.senderRole === "CUSTOMER");
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isSelf ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm space-y-2 ${
                        isSelf
                          ? "bg-brand-primary text-brand-primary-fg rounded-br-sm"
                          : "bg-brand-surface-muted text-brand-text rounded-bl-sm"
                      }`}
                    >
                      <p className="leading-relaxed">{msg.body}</p>
                      {msg.attachmentUrl && (
                        <div className="rounded-xl overflow-hidden border border-white/15">
                          <div className="relative h-28 w-44">
                            <Image
                              src={msg.attachmentUrl}
                              alt={msg.attachmentName ?? "Reference image"}
                              fill
                              sizes="176px"
                              className="object-cover"
                            />
                          </div>
                          <p className="px-2 py-1 text-[10px] opacity-85">
                            {msg.attachmentName}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-brand-muted-fg">
                      <span>{msg.senderName}</span>
                      <span>·</span>
                      <span>{formatDateShort(msg.createdAt)}</span>
                      {isSelf && <CheckCheck className="h-3 w-3 text-brand-accent" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={handleSend}
              className="border-t border-brand-border p-3.5 space-y-2 bg-brand-bg/50"
            >
              {attachmentName && (
                <div className="flex items-center justify-between rounded-xl bg-brand-secondary/60 px-3 py-1.5 text-xs font-medium text-brand-primary">
                  <span>Attached lookbook file: {attachmentName}</span>
                  <button
                    type="button"
                    onClick={() => setAttachmentName("")}
                    className="text-brand-error font-bold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <label
                  title="Attach reference image"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-border bg-brand-surface text-brand-text hover:bg-brand-surface-muted cursor-pointer"
                >
                  <ImagePlus className="h-4.5 w-4.5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setAttachmentName(f.name);
                    }}
                  />
                </label>
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message, share colour ideas, or confirm a fitting..."
                />
                <Button type="submit" variant="primary" size="md">
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
