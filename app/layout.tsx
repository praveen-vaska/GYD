import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { GydStoreProvider } from "@/features/store/gyd-store";
import { ThemeProvider } from "@/components/common/theme-provider";
import { ToastProvider } from "@/components/ui/toast";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GYD – Get Your Designer | Your Occasion. Your Style. Your Designer.",
    template: "%s | GYD – Get Your Designer",
  },
  description:
    "Discover and book verified fashion stylists, bridal couturiers, makeup artists, event decorators, and interior designers across India. Don't Guess Your Style. Get Your Designer.",
  keywords: [
    "Get Your Designer",
    "GYD",
    "wedding styling India",
    "personal stylist Hyderabad",
    "bridal styling Bengaluru",
    "event design Mumbai",
    "interior consultation Chennai",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text selection:bg-brand-accent/20 selection:text-brand-primary">
        <ThemeProvider>
          <ToastProvider>
            <GydStoreProvider>{children}</GydStoreProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
