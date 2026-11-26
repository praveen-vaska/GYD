"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { GydLogo } from "@/components/common/gyd-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { SERVICE_CITIES } from "@/constants/gyd";
import { useGydStore } from "@/features/store/gyd-store";
import { registerCustomerSchema } from "@/lib/validations/schemas";
import { z } from "zod";

type RegisterFormValues = z.infer<typeof registerCustomerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const { registerCustomer } = useGydStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
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

  const onSubmit = (values: RegisterFormValues) => {
    const res = registerCustomer({
      name: values.name,
      email: values.email,
      phone: values.phone,
      city: values.city,
    });
    if (!res.ok) {
      pushToast({
        title: "Registration failed",
        description: res.error,
        type: "error",
      });
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
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12">
      <div className="gyd-panel w-full max-w-lg p-6 sm:p-10 space-y-6">
        <GydLogo />
        <div className="space-y-1.5">
          <Badge tone="accent">Customer Registration</Badge>
          <h1 className="font-editorial text-3xl font-semibold text-brand-text">
            Create Your GYD Account
          </h1>
          <p className="text-sm text-brand-text-secondary">
            Save favourite stylists, book verified professionals, and manage
            celebration briefs.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
              Full Name
            </label>
            <Input placeholder="Ananya Reddy" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-brand-error">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@example.in"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-brand-error">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                Mobile
              </label>
              <Input placeholder="+91 98490 00000" {...register("phone")} />
              {errors.phone && (
                <p className="text-xs text-brand-error">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
              City
            </label>
            <Select {...register("city")}>
              {SERVICE_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                Password
              </label>
              <Input type="password" {...register("password")} />
              {errors.password && (
                <p className="text-xs text-brand-error">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-muted-fg">
                Confirm Password
              </label>
              <Input type="password" {...register("confirmPassword")} />
              {errors.confirmPassword && (
                <p className="text-xs text-brand-error">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            className="w-full"
          >
            Create Account
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex items-center justify-between text-xs text-brand-text-secondary border-t border-brand-border pt-4">
          <Link href="/login" className="font-semibold text-brand-primary hover:underline">
            Already have an account? Sign in
          </Link>
          <Link
            href="/become-a-designer"
            className="font-semibold text-brand-accent hover:underline"
          >
            Register as Designer →
          </Link>
        </div>
      </div>
    </div>
  );
}
