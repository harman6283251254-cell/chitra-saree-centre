import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { notifyOrderPlaced } from "@/lib/whatsapp-server";

// Backup confirmation from Razorpay's servers (in case the customer closes the browser after paying).
// Set this URL in Razorpay Dashboard > Webhooks: https://YOUR-SITE/api/payments/razorpay/webhook
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, sig)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const event = JSON.parse(raw);
  const payment = event?.payload?.payment?.entity;
  const oid: string | undefined = payment?.order_id ?? event?.payload?.order?.entity?.id;
  if (!oid) return NextResponse.json({ ok: true });
  const sb = createServiceSupabase();

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const { data: current } = await sb.from("orders").select("total").eq("razorpay_order_id", oid).maybeSingle();
    if (current && payment?.amount && Math.round(Number(current.total) * 100) !== Number(payment.amount)) {
      console.error("Razorpay amount mismatch for", oid);
      return NextResponse.json({ ok: true });
    }
    const { data: order } = await sb.from("orders")
      .update({ payment_status: "paid", razorpay_payment_id: payment?.id ?? null })
      .eq("razorpay_order_id", oid).neq("payment_status", "paid").neq("order_status", "cancelled")
      .select("id,phone,customer_name,order_number,total").maybeSingle();
    if (order) await notifyOrderPlaced(order);
  } else if (event.event === "payment.failed") {
    await sb.from("orders").update({ payment_status: "failed" }).eq("razorpay_order_id", oid).neq("payment_status", "paid");
  }
  return NextResponse.json({ ok: true });
}
