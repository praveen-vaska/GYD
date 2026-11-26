"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/common/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useGydStore } from "@/features/store/gyd-store";
import { formatDateShort, formatINR } from "@/lib/utils";
import { Booking } from "@/types";

export default function AdminBookingsPage() {
  const { pushToast } = useToast();
  const { state, updateBookingStatus } = useGydStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);

  const filtered = state.bookings.filter((b) => {
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (dateFilter && b.date !== dateFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.bookingCode.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.designerName.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-text">
          All Marketplace Bookings
        </h1>
        <p className="text-sm text-brand-text-secondary">
          Search by booking ID, customer, designer, or date, and intervene on
          cancellations or disputes.
        </p>
      </div>

      <div className="gyd-card p-4 grid gap-3 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted-fg" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID (GYD-26001), customer, or designer..."
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUND_REQUESTED">Refund Requested</option>
        </Select>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>

      <div className="gyd-card overflow-x-auto p-2 sm:p-4">
        <table className="w-full text-left text-sm min-w-[780px]">
          <thead className="border-b border-brand-border text-xs uppercase text-brand-muted-fg">
            <tr>
              <th className="py-3 px-3">Code</th>
              <th className="py-3 px-3">Customer → Designer</th>
              <th className="py-3 px-3">Date & City</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Payment</th>
              <th className="py-3 px-3 text-right">Amount</th>
              <th className="py-3 px-3 text-right">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {filtered.map((b) => (
              <tr key={b.id}>
                <td className="py-3 px-3 font-bold text-brand-primary">
                  {b.bookingCode}
                </td>
                <td className="py-3 px-3">
                  <p className="font-semibold text-brand-text">
                    {b.customerName} → {b.designerName}
                  </p>
                  <p className="text-xs text-brand-muted-fg">{b.serviceTitle}</p>
                </td>
                <td className="py-3 px-3 text-xs">
                  {formatDateShort(b.date)} · {b.city}
                </td>
                <td className="py-3 px-3">
                  <BookingStatusBadge status={b.status} />
                </td>
                <td className="py-3 px-3">
                  <PaymentStatusBadge status={b.paymentStatus} />
                </td>
                <td className="py-3 px-3 text-right font-bold">
                  {formatINR(b.totalAmountInr)}
                </td>
                <td className="py-3 px-3 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelected(b)}
                  >
                    Inspect
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={`Booking Dispute & Detail · ${selected?.bookingCode ?? ""}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="flex gap-2">
              <BookingStatusBadge status={selected.status} />
              <PaymentStatusBadge status={selected.paymentStatus} />
              <Badge tone="primary">{selected.occasion}</Badge>
            </div>
            <p>
              <strong>Address:</strong> {selected.addressFull}
            </p>
            <p>
              <strong>Brief:</strong>{" "}
              {selected.requirements.additionalRequirements}
            </p>
            <div className="flex flex-wrap gap-2 pt-3 border-t border-brand-border">
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  updateBookingStatus(
                    selected.id,
                    "CONFIRMED",
                    "Admin confirmed booking resolution."
                  );
                  setSelected(null);
                  pushToast({ title: "Booking marked Confirmed", type: "success" });
                }}
              >
                Force Confirm
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  updateBookingStatus(
                    selected.id,
                    "CANCELLED",
                    "Admin resolved dispute & cancelled booking.",
                    { cancellationReason: "Admin cancellation intervention" }
                  );
                  setSelected(null);
                  pushToast({ title: "Booking cancelled by Admin", type: "info" });
                }}
              >
                Cancel & Trigger Refund Check
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
