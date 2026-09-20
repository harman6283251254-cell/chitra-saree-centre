import "server-only";
import { cache } from "react";
import { createPublicSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Category, NamedItem, Product, Settings, Subcategory } from "@/lib/types";

export const PRODUCT_SELECT =
  "*, category:categories(id,name,slug), subcategory:subcategories(id,name,slug), fabric:fabrics(id,name), work_type:work_types(id,name), images:product_images(id,url,is_main,sort_order,storage_path)";

export const DEFAULT_SETTINGS: Settings = {
  business_name: "Chitra Saree Centre", tagline: "Tradition. Elegance. You.",
  phone_primary: "9888821306", phone_secondary: "6283251254", whatsapp_number: "6283251254",
  email: "harman6283251254@gmail.com", maps_url: "https://maps.app.goo.gl/Gk8WSs1r3jWBtUtB8",
  store_address: null, store_hours: null,
  store_description: "Chitra Saree Centre brings you sarees, suits, lehengas, shararas, ghararas and kurta pajamas for weddings, parties and every celebration in between.",
  logo_url: "/logo.jpg", instagram_url: "https://www.instagram.com/chitrasareecentre/", facebook_url: null, youtube_url: null,
  return_policy: null, shipping_policy: null, shipping_fee: 0, free_shipping_above: null,
  cod_enabled: true, upi_enabled: true, upi_id: "harman6283251254@okicici", upi_payee_name: "Harman Arora",
  upi_qr_url: "/upi-qr.jpg", low_stock_threshold: 3,
};

export const getSettings = cache(async (): Promise<Settings> => {
  if (!isSupabaseConfigured()) return DEFAULT_SETTINGS;
  const { data } = await createPublicSupabase().from("settings").select("*").eq("id", 1).maybeSingle();
  return data ? { ...DEFAULT_SETTINGS, ...stripNulls(data) } : DEFAULT_SETTINGS;
});

function stripNulls<T extends Record<string, unknown>>(o: T) {
  // keep explicit nulls for optional text, but never let required fields become null
  return { ...o, business_name: o.business_name || DEFAULT_SETTINGS.business_name } as T;
}

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!isSupabaseConfigured()) return [];
  const { data } = await createPublicSupabase().from("categories").select("*").eq("is_active", true).order("sort_order");
  return (data ?? []) as Category[];
});

export const getLookups = cache(async () => {
  if (!isSupabaseConfigured()) return { subcategories: [] as Subcategory[], fabrics: [] as NamedItem[], works: [] as NamedItem[] };
  const sb = createPublicSupabase();
  const [s, f, w] = await Promise.all([
    sb.from("subcategories").select("*").order("sort_order"),
    sb.from("fabrics").select("*").order("sort_order"),
    sb.from("work_types").select("*").order("sort_order"),
  ]);
  return { subcategories: (s.data ?? []) as Subcategory[], fabrics: (f.data ?? []) as NamedItem[], works: (w.data ?? []) as NamedItem[] };
});

export type ProductQuery = {
  q?: string; category?: string; sub?: string; fabric?: string; work?: string;
  min?: string; max?: string; stock?: string; sort?: string;
  flag?: "featured" | "new" | "best"; limit?: number; excludeId?: string;
};

const UUID = /^[0-9a-f-]{36}$/i;

export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = createPublicSupabase();
  let req = sb.from("products").select(PRODUCT_SELECT);

  if (query.category) {
    const cats = await getCategories();
    const cat = cats.find((c) => c.slug === query.category);
    if (!cat) return [];
    req = req.eq("category_id", cat.id);
  }
  if (query.sub && UUID.test(query.sub)) req = req.eq("subcategory_id", query.sub);
  if (query.fabric && UUID.test(query.fabric)) req = req.eq("fabric_id", query.fabric);
  if (query.work && UUID.test(query.work)) req = req.eq("work_type_id", query.work);
  const min = Number(query.min), max = Number(query.max);
  if (query.min && Number.isFinite(min)) req = req.gte("price", min);
  if (query.max && Number.isFinite(max) && max > 0) req = req.lte("price", max);
  if (query.stock === "in") req = req.gt("stock", 0).eq("is_available", true);
  if (query.flag === "featured") req = req.eq("is_featured", true);
  if (query.flag === "new") req = req.eq("is_new_arrival", true);
  if (query.flag === "best") req = req.eq("is_best_seller", true);
  if (query.excludeId) req = req.neq("id", query.excludeId);

  // Search: every word must appear in name, code, tags, category, fabric or work.
  const words = (query.q ?? "").toLowerCase().replace(/[%_,()*\\]/g, " ").split(/\s+/).filter(Boolean).slice(0, 6);
  for (const w of words) req = req.ilike("search_text", `%${w}%`);

  switch (query.sort) {
    case "price_asc": req = req.order("price", { ascending: true }); break;
    case "price_desc": req = req.order("price", { ascending: false }); break;
    case "popular": req = req.order("sold_count", { ascending: false }).order("created_at", { ascending: false }); break;
    default: req = req.order("created_at", { ascending: false });
  }
  req = req.limit(query.limit ?? 60);

  const { data, error } = await req;
  if (error) console.error("getProducts", error.message);
  return (data ?? []) as unknown as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await createPublicSupabase().from("products").select(PRODUCT_SELECT).eq("slug", slug).maybeSingle();
  return (data as unknown as Product) ?? null;
}
