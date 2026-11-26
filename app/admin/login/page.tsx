"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { GydLogo } from "@/components/common/gyd-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useGydStore } from "@/features/store/gyd-store";

export default function AdminLoginPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const { loginAdminWithCredentials } = useGydStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter both your administrator email and password.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await loginAdminWithCredentials(email, password);
      if (!res.ok) {
        setError(res.error ?? "Authentication failed.");
        return;
      }
      pushToast({
        title: "Administrator authenticated",
        description: "Signed in to GYD Operations Console.",
        type: "success",
      });
      router.replace("/admin/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12">
      <div className="gyd-panel w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <GydLogo subtitle="Operations Security" />
          <Badge tone="primary">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-accent" />
            Restricted Administrator Access
          </Badge>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-brand-text">
            Admin Console Sign In
          </h1>
          <p className="text-xs sm:text-sm text-brand-text-secondary">
            Authorized GYD operations personnel only. Unauthenticated requests are
            blocked.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-brand-error-border bg-brand-error-bg px-4 py-3 text-xs font-medium text-brand-error"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-email"
              className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg"
            >
              Administrator Email
            </label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@getyourdesigner.in"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-password"
              className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter administrator password"
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            <Lock className="h-4 w-4" />
            {submitting ? "Verifying Credentials..." : "Sign In to Admin Console"}
          </Button>
        </form>

        <div className="border-t border-brand-border pt-4 text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-brand-muted-fg hover:text-brand-primary transition-colors"
          >
            ← Return to Public Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
