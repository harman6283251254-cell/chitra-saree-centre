import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabase } from "@/lib/supabase/server";
import { createRazorpayOrder, razorpayConfigured, razorpayPublicKey } from "@/lib/razorpay";
import { getSettings } from "@/lib/data";

const body = z.object({ token: z.string().uuid() });

// Creates a Razorpay payment for an existing order. The AMOUNT comes from our database, never from the browser.
export async function POST(req: Request) {
  if (!razorpayConfigured()) return NextResponse.json({ error: "Online payment is not set up yet." }, { status: 400 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const sb = createServiceSupabase();
  const { data: order } = await sb.from("orders")
    .select("id,order_number,total,payment_status,order_status,customer_name,phone,email")
    .eq("public_token", parsed.data.token).eq("payment_method", "razorpay").maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.payment_status === "paid") return NextResponse.json({ error: "This order is already paid." }, { status: 400 });
  if (order.order_status === "cancelled") return NextResponse.json({ error: "This order was cancelled." }, { status: 400 });

  try {
    const rz = await createRazorpayOrder(Number(order.total), order.order_number);
    await sb.from("orders").update({ razorpay_order_id: rz.id, payment_status: "pending" }).eq("id", order.id);
    const s = await getSettings();
    return NextResponse.json({
      key: razorpayPublicKey(), orderId: rz.id, amount: rz.amount, currency: rz.currency,
      name: s.business_name, description: `Order ${order.order_number}`,
      prefill: { name: order.customer_name, contact: order.phone, email: order.email ?? "" },
    });
  } catch (e) {
    console.error("razorpay order", (e as Error).message);
    return NextResponse.json({ error: "Could not start the payment. Please try again." }, { status: 502 });
  }
}
