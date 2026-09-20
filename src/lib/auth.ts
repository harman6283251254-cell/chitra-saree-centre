import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

/** Returns the logged-in admin, or null. Checks the admin list in the database, not just the login. */
export async function getAdmin() {
  const sb = await createServerSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  return data ? { user, sb } : null;
}

/** For admin pages: sends non-admins to the login page. */
export async function requireAdminPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** For admin actions/APIs: throws if not an admin. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) throw new Error("Not authorised");
  return admin;
}
