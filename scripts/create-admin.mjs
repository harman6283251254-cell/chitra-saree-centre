// Creates (or promotes) the shop owner's admin login.
// Usage:  npm run create-admin -- owner@example.com "A-Strong-Password"
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [email, password] = process.argv.slice(2);

if (!url || !key) { console.error("✗ Fill NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first."); process.exit(1); }
if (!email || !/^\S+@\S+\.\S+$/.test(email)) { console.error('✗ Usage: npm run create-admin -- you@example.com "Your-Strong-Password"'); process.exit(1); }
if (!password || password.length < 10) { console.error("✗ Choose a password of at least 10 characters."); process.exit(1); }

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

let userId;
const { data: created, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
if (created?.user) {
  userId = created.user.id;
  console.log("✓ Login created for", email);
} else if (error && /already|registered|exists/i.test(error.message)) {
  // Existing user: find it and reset the password
  for (let page = 1; !userId && page < 50; page++) {
    const { data } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    const u = data?.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u) userId = u.id;
    if (!data || data.users.length < 200) break;
  }
  if (!userId) { console.error("✗ User exists but could not be found:", error.message); process.exit(1); }
  const { error: upErr } = await sb.auth.admin.updateUserById(userId, { password });
  if (upErr) { console.error("✗ Could not update password:", upErr.message); process.exit(1); }
  console.log("✓ Existing login found; password updated for", email);
} else {
  console.error("✗ Could not create login:", error?.message); process.exit(1);
}

const { error: aErr } = await sb.from("admin_users").upsert({ user_id: userId, display_name: email }, { onConflict: "user_id" });
if (aErr) { console.error("✗ Could not grant admin access:", aErr.message, "\n  Did you run supabase/schema.sql first?"); process.exit(1); }
console.log("✓ Admin access granted. Log in at /admin/login");
