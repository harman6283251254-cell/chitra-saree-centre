import { NextResponse } from "next/server";
import { checkoutSchema, firstError } from "@/lib/validation";
import { createServiceSupabase, createServerSupabase } from "@/lib/supabase/server";
import { razorpayConfigured } from "@/lib/razorpay";
import { notifyOrderPlaced } from "@/lib/whatsapp-server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!(await rateLimit("order", 8, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes or call us to order." }, { status: 429 });
  }
  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const input = parsed.data;
  if (input.payment_method === "razorpay" && !razorpayConfigured()) {
    return NextResponse.json({ error: "Online payment is not available yet. Please choose another payment option." }, { status: 400 });
  }

  // If the shopper is logged in, attach the order to their account (server-side
  // only — never trust a user_id sent from the browser). Guest checkout still
  // works exactly as before when there's no session.
  const sessionSb = await createServerSupabase();
  const { data: { user } } = await sessionSb.auth.getUser();

  const sb = createServiceSupabase();
  const { data, error } = await sb.rpc("place_order", { p: { ...input, user_id: user?.id ?? null } }).single<{ order_id: string; order_number: string; public_token: string; total: number }>();
  if (error || !data) {
    const msg = error?.message ?? "";
    if (msg.startsWith("OUT_OF_STOCK:")) return NextResponse.json({ error: `Sorry, "${msg.slice(13)}" is out of stock or has fewer pieces left than you selected.` }, { status: 409 });
    if (msg.includes("PRODUCT_NOT_FOUND")) return NextResponse.json({ error: "A product in your cart is no longer available. Please refresh your cart." }, { status: 409 });
    if (msg.includes("METHOD_DISABLED")) return NextResponse.json({ error: "That payment option is not available. Please choose another." }, { status: 400 });
    console.error("place_order failed", msg);
    return NextResponse.json({ error: "We could not place your order. Please try again or call us." }, { status: 500 });
  }

  // Online payments are confirmed on WhatsApp only after the payment is verified.
  if (input.payment_method !== "razorpay") {
    await notifyOrderPlaced({ id: data.order_id, phone: input.phone, customer_name: input.name, order_number: data.order_number, total: data.total });
  }
  return NextResponse.json({ token: data.public_token, orderNumber: data.order_number, method: input.payment_method });
}
