"use client";

import React, { useState } from "react";
import { Ban, CheckCircle2, Eye, Search, Trash2 } from "lucide-react";
import { AccountStatusBadge } from "@/components/common/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useGydStore } from "@/features/store/gyd-store";
import { formatDateShort } from "@/lib/utils";
import { AccountStatus, User } from "@/types";

export default function AdminUsersPage() {
  const { pushToast } = useToast();
  const { state, updateUserAccountStatus, removeUser } = useGydStore();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "CUSTOMER" | "DESIGNER">("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<User | null>(null);

  const manageableUsers = state.users.filter((u) => u.role !== "ADMIN");
  const filtered = manageableUsers.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q)
    );
  });

  const handleStatusChange = (user: User, nextStatus: AccountStatus) => {
    updateUserAccountStatus(user.id, nextStatus);
    pushToast({
      title:
        nextStatus === "SUSPENDED"
          ? `${user.name} blocked`
          : nextStatus === "ACTIVE"
            ? `${user.name} unblocked & active`
            : `${user.name} deactivated`,
      description:
        nextStatus === "ACTIVE"
          ? "Account restored across portals."
          : "Login, bookings, and public listing access disabled.",
      type: nextStatus === "ACTIVE" ? "success" : "warning",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-text">
          Users & Account Moderation
        </h1>
        <p className="text-sm text-brand-text-secondary">
          Block, deactivate, restore, or permanently remove customer and designer
          accounts across the marketplace.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "ALL", label: `All Accounts (${manageableUsers.length})` },
            {
              id: "CUSTOMER",
              label: `Customers (${manageableUsers.filter((u) => u.role === "CUSTOMER").length})`,
            },
            {
              id: "DESIGNER",
              label: `Designers (${manageableUsers.filter((u) => u.role === "DESIGNER").length})`,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRoleFilter(tab.id)}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer ${
              roleFilter === tab.id
                ? "bg-brand-primary text-brand-primary-fg"
                : "bg-brand-surface border border-brand-border text-brand-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="gyd-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted-fg" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or city..."
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-44"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Blocked / Suspended</option>
        </Select>
      </div>

      <div className="gyd-card overflow-x-auto p-2 sm:p-4">
        <table className="w-full text-left text-sm min-w-[760px]">
          <thead className="border-b border-brand-border text-xs uppercase text-brand-muted-fg">
            <tr>
              <th className="py-3 px-3">Account</th>
              <th className="py-3 px-3">Role & City</th>
              <th className="py-3 px-3">Bookings</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {filtered.map((user) => {
              const bookingCount = state.bookings.filter(
                (b) => b.customerId === user.id || b.designerId === state.designers.find((d) => d.userId === user.id)?.id
              ).length;
              return (
                <tr key={user.id}>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-brand-text">{user.name}</p>
                    <p className="text-xs text-brand-muted-fg">{user.email}</p>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <Badge tone={user.role === "DESIGNER" ? "accent" : "neutral"}>
                        {user.role}
                      </Badge>
                      <span className="text-xs text-brand-text-secondary">{user.city}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold">{bookingCount}</td>
                  <td className="py-3 px-3">
                    <AccountStatusBadge status={user.status} />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex flex-wrap justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Inspect
                      </Button>
                      {user.status !== "ACTIVE" ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleStatusChange(user, "ACTIVE")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Unblock
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-brand-error"
                          onClick={() => handleStatusChange(user, "SUSPENDED")}
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Block
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-brand-error"
                        onClick={() => setConfirmRemove(user)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(confirmRemove)}
        onClose={() => setConfirmRemove(null)}
        title={`Remove ${confirmRemove?.name ?? "User"}?`}
        description="This permanently deletes the account (and any linked designer studio) across the website."
      >
        {confirmRemove && (
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRemove(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                const res = removeUser(confirmRemove.id);
                if (res.ok) {
                  pushToast({
                    title: `${confirmRemove.name} removed permanently`,
                    type: "info",
                  });
                } else if (res.error) {
                  pushToast({ title: res.error, type: "error" });
                }
                setConfirmRemove(null);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Confirm Remove
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.name}
        description={selectedUser?.email}
      >
        {selectedUser && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <AccountStatusBadge status={selectedUser.status} />
              <Badge tone="primary">{selectedUser.city}</Badge>
            </div>
            <p>
              <strong>Phone:</strong> {selectedUser.phone}
            </p>
            <p>
              <strong>Joined:</strong> {formatDateShort(selectedUser.createdAt)}
            </p>
            <p>
              <strong>Total Bookings:</strong>{" "}
              {
                state.bookings.filter((b) => b.customerId === selectedUser.id)
                  .length
              }
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
