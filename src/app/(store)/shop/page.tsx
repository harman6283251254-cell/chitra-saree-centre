import type { Metadata } from "next";
import ShopView from "@/components/store/ShopView";
import SetupNotice from "@/components/store/SetupNotice";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Shop sarees, suits, lehengas & ethnic wear",
  description: "Browse sarees, suits, lehengas, shararas, ghararas and kurta pajamas. Filter by fabric, work and price.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  return <ShopView sp={await searchParams} />;
}
