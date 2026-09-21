import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

/** Returns the logged-in customer (any authenticated user), or null. */
export async function getCustomer() {
  const sb = await createServerSupabase();
  const { data: { user } } = await sb.auth.getUser();
  return user ? { user, sb } : null;
}

/** For customer pages like /account: sends signed-out visitors to /login. */
export async function requireCustomerPage() {
  const customer = await getCustomer();
  if (!customer) redirect("/login");
  return customer;
}
