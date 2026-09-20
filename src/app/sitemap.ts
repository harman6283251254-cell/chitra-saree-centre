import type { MetadataRoute } from "next";
import { SITE_URL, isSupabaseConfigured } from "@/lib/env";
import { createPublicSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/shop", "/categories", "/about", "/contact", "/policies"].map((p) => ({ url: SITE_URL + p, changeFrequency: "weekly" as const }));
  if (!isSupabaseConfigured()) return pages;
  const sb = createPublicSupabase();
  const [{ data: products }, { data: cats }] = await Promise.all([
    sb.from("products").select("slug, updated_at").eq("is_demo", false).limit(5000),
    sb.from("categories").select("slug").eq("is_active", true),
  ]);
  return [
    ...pages,
    ...(cats ?? []).map((c) => ({ url: `${SITE_URL}/category/${c.slug}` })),
    ...(products ?? []).map((p) => ({ url: `${SITE_URL}/product/${p.slug}`, lastModified: p.updated_at })),
  ];
}
