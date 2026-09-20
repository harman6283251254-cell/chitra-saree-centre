import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabase } from "@/lib/supabase/server";
import { indianMobile } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

const body = z.object({ orderNumber: z.string().trim().toUpperCase().regex(/^CSC-\d{3,10}$/, "Order ID looks like CSC-1001"), phone: indianMobile });

export async function POST(req: Request) {
  if (!(await rateLimit("track", 15, 10 * 60 * 1000))) return NextResponse.json({ error: "Too many attempts. Please try later." }, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { data } = await createServiceSupabase().from("orders").select("public_token")
    .eq("order_number", parsed.data.orderNumber).eq("phone", parsed.data.phone).maybeSingle();
  if (!data) return NextResponse.json({ error: "No order found with that order ID and mobile number." }, { status: 404 });
  return NextResponse.json({ token: data.public_token });
}
