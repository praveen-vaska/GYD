"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { GydLogo } from "@/components/common/gyd-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12">
      <div className="gyd-panel w-full max-w-md p-6 sm:p-8 space-y-6">
        <GydLogo />
        {submitted ? (
          <div className="space-y-4 text-center py-4">
            <CheckCircle2 className="mx-auto h-10 w-10 text-brand-success" />
            <h1 className="font-editorial text-2xl font-semibold text-brand-text">
              Reset Link Prepared (Demo)
            </h1>
            <p className="text-sm text-brand-text-secondary">
              In production via Resend, a password recovery email would be
              dispatched to <strong>{email}</strong>.
            </p>
            <Button asChild variant="primary" className="w-full">
              <Link href="/login">Return to Sign In</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <h1 className="font-editorial text-2xl font-semibold text-brand-text">
                Reset Password
              </h1>
              <p className="text-sm text-brand-text-secondary">
                Enter your registered GYD email address.
              </p>
            </div>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.in"
            />
            <Button type="submit" variant="primary" className="w-full">
              <Mail className="h-4 w-4" />
              Send Recovery Instructions
            </Button>
            <div className="text-center">
              <Link
                href="/login"
                className="text-xs font-semibold text-brand-muted-fg hover:text-brand-primary"
              >
                ← Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
