"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { GydLogo } from "@/components/common/gyd-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { DEMO_ACCOUNTS, SERVICE_CITIES } from "@/constants/gyd";
import { useGydStore } from "@/features/store/gyd-store";
import { getRoleDashboardPath } from "@/lib/auth/session";
import { loginSchema, registerCustomerSchema } from "@/lib/validations/schemas";
import { z } from "zod";

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerCustomerSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const { loginWithCredentials, registerCustomer, loginDemoRole } = useGydStore();
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState("");

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      city: "Hyderabad",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (values: LoginFormValues) => {
    setAuthError("");
    const res = loginWithCredentials(values.email, values.password);
    if (!res.ok || !res.data) {
      setAuthError(res.error ?? "Invalid credentials.");
      return;
    }
    pushToast({
      title: `Welcome back, ${res.data.name}`,
      description: `Signed in to ${res.data.role.toLowerCase()} portal (Demo Mode).`,
      type: "success",
    });
    router.push(getRoleDashboardPath(res.data.role));
  };

  const onRegisterSubmit = (values: RegisterFormValues) => {
    setAuthError("");
    const res = registerCustomer({
      name: values.name,
      email: values.email,
      phone: values.phone,
      city: values.city,
    });
    if (!res.ok) {
      setAuthError(res.error ?? "Could not create account.");
      return;
    }
    pushToast({
      title: "Welcome to GYD!",
      description: "Your customer account is active in Demo Mode.",
      type: "success",
    });
    router.push("/customer/dashboard");
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center px-4 py-12">
      <div className="gyd-container max-w-6xl grid gap-8 lg:grid-cols-12 items-start">
        <div className="lg:col-span-6 gyd-panel p-6 sm:p-10 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <GydLogo />
            <Link
              href="/"
              className="text-xs font-semibold text-brand-muted-fg hover:text-brand-primary"
            >
              ← Storefront
            </Link>
          </div>

          {/* Unified Login / New User Switcher */}
          <div className="grid grid-cols-2 rounded-2xl bg-brand-surface-muted p-1">
            <button
              type="button"
              onClick={() => {
                setAuthTab("login");
                setAuthError("");
              }}
              className={`rounded-xl py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                authTab === "login"
                  ? "bg-brand-primary text-brand-primary-fg shadow-sm"
                  : "text-brand-text-secondary hover:text-brand-text"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab("register");
                setAuthError("");
              }}
              className={`rounded-xl py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                authTab === "register"
                  ? "bg-brand-primary text-brand-primary-fg shadow-sm"
                  : "text-brand-text-secondary hover:text-brand-text"
              }`}
            >
              New User? Create Account
            </button>
          </div>

          <div className="space-y-1">
            <Badge tone="primary">Demo Authentication Ready</Badge>
            <h1 className="font-editorial text-3xl font-semibold text-brand-text">
              {authTab === "login" ? "Sign in to GYD" : "Create Your GYD Account"}
            </h1>
            <p className="text-sm text-brand-text-secondary">
              {authTab === "login"
                ? "Access your bookings, saved stylists, or designer studio."
                : "New customer? Set up your profile in seconds to book designers."}
            </p>
          </div>

          {authError && (
            <div className="rounded-xl border border-brand-error-border bg-brand-error-bg px-4 py-3 text-xs font-medium text-brand-error">
              {authError}
            </div>
          )}

          {authTab === "login" ? (
            <form
              onSubmit={loginForm.handleSubmit(onLoginSubmit)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="customer.demo@gyd.in"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-brand-error">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-brand-accent hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-brand-error">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loginForm.formState.isSubmitting}
                className="w-full"
              >
                Sign In
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <form
              onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  Full Name
                </label>
                <Input
                  placeholder="Ananya Reddy"
                  {...registerForm.register("name")}
                />
                {registerForm.formState.errors.name && (
                  <p className="text-xs text-brand-error">
                    {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.in"
                    {...registerForm.register("email")}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-brand-error">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                    Mobile
                  </label>
                  <Input
                    placeholder="+91 98490 00000"
                    {...registerForm.register("phone")}
                  />
                  {registerForm.formState.errors.phone && (
                    <p className="text-xs text-brand-error">
                      {registerForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                  City
                </label>
                <Select {...registerForm.register("city")}>
                  {SERVICE_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                    Password
                  </label>
                  <Input type="password" {...registerForm.register("password")} />
                  {registerForm.formState.errors.password && (
                    <p className="text-xs text-brand-error">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    {...registerForm.register("confirmPassword")}
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-brand-error">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={registerForm.formState.isSubmitting}
                className="w-full"
              >
                Create Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          <div className="border-t border-brand-border pt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-brand-text-secondary">
            <span>Are you a stylist or decorator?</span>
            <Link
              href="/become-a-designer"
              className="font-semibold text-brand-accent hover:underline"
            >
              Apply as a Designer →
            </Link>
          </div>
        </div>

        {/* Clearly Labeled Demo Credentials Panel */}
        <div className="lg:col-span-6 space-y-4">
          <div className="gyd-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-brand-accent" />
              <h2 className="font-editorial text-2xl font-semibold text-brand-text">
                Instant Demo Access Portals
              </h2>
            </div>
            <p className="text-xs text-brand-text-secondary leading-relaxed">
              This environment uses local demonstration sessions instead of a live
              production Auth.js database. Launch any role immediately:
            </p>

            <div className="space-y-3">
              {DEMO_ACCOUNTS.map((acc) => (
                <div
                  key={acc.role}
                  className="rounded-2xl border border-brand-border bg-brand-bg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-brand-text">
                        {acc.label}
                      </span>
                      <Badge tone="accent">{acc.city}</Badge>
                    </div>
                    <p className="text-xs text-brand-text-secondary">
                      {acc.description}
                    </p>
                    <p className="text-[11px] font-mono text-brand-muted-fg flex items-center gap-1.5">
                      <KeyRound className="h-3 w-3" />
                      {acc.email} · {acc.passcodeLabel}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const sess = loginDemoRole(acc.role);
                      if (!sess) {
                        pushToast({
                          title: "Account blocked or removed",
                          description:
                            "This account has been blocked or deleted in Admin moderation.",
                          type: "error",
                        });
                        return;
                      }
                      pushToast({
                        title: `Signed in as ${sess.name}`,
                        description: `Opened ${acc.label}`,
                        type: "success",
                      });
                      router.push(acc.redirectHref);
                    }}
                  >
                    Enter Portal
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 text-xs text-brand-muted-fg">
              <ShieldCheck className="h-4 w-4 text-brand-success shrink-0" />
              <span>
                Production RBAC, Zod validation, and Prisma schema included for
                backend cutover.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
