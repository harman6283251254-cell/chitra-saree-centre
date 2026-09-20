"use client";
import { createBrowserClient } from "@supabase/ssr";

function normalizeSupabaseUrl(raw: string): string {
  const v = raw.trim();
  const m = v.match(/^https:\/\/[a-z0-9-]+\.supabase\.co/i);
  return m ? m[0] : v.replace(/\/+$/, "");
}

export function createBrowserSupabase() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  return createBrowserClient(url, key);
}
