import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabase } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const body = z.object({ token: z.string().uuid(), reference: z.string().trim().regex(/^[A-Za-z0-9]{6,30}$/, "Enter the 12-digit UPI reference / UTR number") });

// Customer tells us the UPI transaction reference; the shop owner checks it in their bank app.
export async function POST(req: Request) {
  if (!(await rateLimit("upi-ref", 10, 10 * 60 * 1000))) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { error, count } = await createServiceSupabase().from("orders")
    .update({ upi_reference: parsed.data.reference }, { count: "exact" })
    .eq("public_token", parsed.data.token).eq("payment_method", "upi").eq("payment_status", "awaiting_verification");
  if (error || !count) return NextResponse.json({ error: "Could not save the reference for this order." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
