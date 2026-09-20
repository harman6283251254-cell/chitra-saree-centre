import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL || "https://chitra-saree-centre.vercel.app"),
  title: {
    default: "Chitra Saree Centre — Sarees, Suits, Lehengas & Ethnic Wear",
    template: "%s | Chitra Saree Centre",
  },
  description:
    "Shop sarees, suits, lehengas, shararas, ghararas and kurta pajamas for weddings and parties at Chitra Saree Centre.",
  openGraph: {
    type: "website",
    siteName: "Chitra Saree Centre",
    images: ["/logo.jpg"],
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#5C0F2B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}