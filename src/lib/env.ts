function normalizeSupabaseUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  // Auto-correct the common mistake of pasting the REST/Auth URL
  // (https://xxx.supabase.co/rest/v1/, /auth/v1/, trailing slash, etc.)
  // instead of the plain Project URL — keep only the https://<ref>.supabase.co origin.
  const m = v.match(/^https:\/\/[a-z0-9-]+\.supabase\.co/i);
  return m ? m[0] : v.replace(/\/+$/, "");
}

export const SUPABASE_URL = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").trim().replace(/\/$/, "");

export const isSupabaseConfigured = () =>
  Boolean(
    SUPABASE_URL &&
      SUPABASE_ANON_KEY &&
      /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL) &&
      !SUPABASE_URL.includes("your-project-id"),
  );
