// Tests the real Supabase connection using your .env.local and prints the
// EXACT error if something is wrong. Never prints key values.
// Usage: npm run diagnose
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("=== Chitra Saree Centre — Supabase connection check ===\n");

let ok = true;
for (const [name, v] of [["NEXT_PUBLIC_SUPABASE_URL", url], ["NEXT_PUBLIC_SUPABASE_ANON_KEY", anon], ["SUPABASE_SERVICE_ROLE_KEY", service]]) {
  const present = Boolean(v && v.length > 0 && !/your-project-id|your-anon|your-service/.test(v));
  console.log(`${present ? "✓" : "✗"} ${name} ${present ? `(set, ${v.length} chars)` : "is missing or still a placeholder"}`);
  if (!present) ok = false;
}
if (!ok) {
  console.log("\nFix the ✗ items in .env.local first, then run `npm run diagnose` again.");
  process.exit(1);
}
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)) {
  console.log(`\n✗ NEXT_PUBLIC_SUPABASE_URL doesn't look like "https://<project-ref>.supabase.co". Check Project Settings → API.`);
  process.exit(1);
}

console.log("\nTesting anon (public) connection...");
try {
  const pub = createClient(url, anon, { auth: { persistSession: false } });
  const { error, count } = await pub.from("settings").select("*", { count: "exact", head: true });
  if (error) {
    console.log("✗ Anon connection failed:", error.message || error.hint || error.code || JSON.stringify(error));
    if (/relation .* does not exist/i.test(error.message)) {
      console.log("  → Your tables aren't created yet. Run supabase/schema.sql then supabase/seed.sql in the Supabase SQL Editor.");
    } else if (/Invalid API key/i.test(error.message)) {
      console.log("  → NEXT_PUBLIC_SUPABASE_ANON_KEY doesn't match this project. Re-copy it from Project Settings → API.");
    }
    ok = false;
  } else {
    console.log(`✓ Anon connection works (settings table reachable, rows: ${count ?? "?"})`);
  }
} catch (e) {
  console.log("✗ Anon connection threw an error:", e?.message || e?.cause?.message || String(e));
  ok = false;
}

console.log("\nTesting service-role (admin) connection...");
try {
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error, count } = await admin.from("products").select("*", { count: "exact", head: true });
  if (error) {
    console.log("✗ Service-role connection failed:", error.message || error.hint || error.code || JSON.stringify(error));
    if (/Invalid API key/i.test(error.message)) console.log("  → SUPABASE_SERVICE_ROLE_KEY doesn't match this project. Re-copy the `service_role` secret key from Project Settings → API.");
    ok = false;
  } else {
    console.log(`✓ Service-role connection works (products table reachable, rows: ${count ?? 0})`);
    if ((count ?? 0) === 0) console.log("  → No products yet — did supabase/seed.sql run successfully?");
  }
} catch (e) {
  console.log("✗ Service-role connection threw an error:", e?.message || e?.cause?.message || String(e));
  ok = false;
}

console.log(ok ? "\n✓ All checks passed — run `npm start` and the real website should load." : "\n✗ Fix the items above, then run `npm run diagnose` again.");
process.exit(ok ? 0 : 1);
