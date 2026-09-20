import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabase } from "@/lib/supabase/server";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { notifyOrderPlaced } from "@/lib/whatsapp-server";

const body = z.object({
  razorpay_order_id: z.string().max(64), razorpay_payment_id: z.string().max(64), razorpay_signature: z.string().max(256),
});

// Marks an order as PAID only after checking Razorpay's cryptographic signature on the server.
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { razorpay_order_id: oid, razorpay_payment_id: pid, razorpay_signature: sig } = parsed.data;
  if (!verifyPaymentSignature(oid, pid, sig)) return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 });

  const sb = createServiceSupabase();
  const { data: order } = await sb.from("orders")
    .update({ payment_status: "paid", razorpay_payment_id: pid })
    .eq("razorpay_order_id", oid).neq("payment_status", "paid").neq("order_status", "cancelled")
    .select("id,public_token,phone,customer_name,order_number,total").maybeSingle();
  if (order) await notifyOrderPlaced(order);
  const { data: existing } = order ? { data: order } : await sb.from("orders").select("public_token").eq("razorpay_order_id", oid).maybeSingle();
  return NextResponse.json({ ok: true, token: existing?.public_token });
}
