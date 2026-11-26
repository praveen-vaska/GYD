import React from "react";
import { Navbar } from "@/components/navigation/navbar";
import { Footer } from "@/components/layout/footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-bg text-brand-text">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
