import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createServiceSupabase } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { formatDate, formatINR, paymentMethodLabel, statusLabel } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { RazorpayRetry, UpiReferenceForm } from "@/components/store/OrderPaymentActions";
import ProductImage from "@/components/store/ProductImage";
import { WhatsAppIcon } from "@/components/Icon";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;
const STEP_LABEL: Record<string, string> = { pending: "Order placed", confirmed: "Confirmed", processing: "Being prepared", shipped: "Shipped", delivered: "Delivered" };

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const [{ data }, s] = await Promise.all([
    createServiceSupabase().from("orders").select("*, items:order_items(*)").eq("public_token", token).maybeSingle(),
    getSettings(),
  ]);
  if (!data) notFound();
  const o = data as Order;
  const stepIndex = STEPS.indexOf(o.order_status as (typeof STEPS)[number]);
  const upiLink = s.upi_id
    ? `upi://pay?pa=${encodeURIComponent(s.upi_id)}&pn=${encodeURIComponent(s.upi_payee_name || s.business_name)}&am=${Number(o.total).toFixed(2)}&cu=INR&tn=${encodeURIComponent("Order " + o.order_number)}`
    : null;

  return (
    <div className="page max-w-3xl pt-10">
      <p className="text-ink-mute">Thank you, {o.customer_name.split(" ")[0]}.</p>
      <h1 className="mt-1 font-display text-4xl sm:text-5xl">Order {o.order_number}</h1>
      <p className="mt-2 text-sm text-ink-soft">Placed on {formatDate(o.created_at)}. Save this page link or note your order ID to track it later.</p>

      {/* Status */}
      <section className="mt-8 rounded-2xl border border-zari/30 bg-white p-6" aria-label="Order status">
        {o.order_status === "cancelled" ? (
          <p className="text-lg text-wine">This order was cancelled. Contact us if you have any questions.</p>
        ) : (
          <ol className="grid grid-cols-5 gap-1">
            {STEPS.map((st, i) => (
              <li key={st} className="text-center">
                <div className={`mx-auto h-1.5 rounded-full ${i <= stepIndex ? "bg-wine" : "bg-ink/10"}`} />
                <span className={`mt-2 block text-[11px] sm:text-sm ${i <= stepIndex ? "text-wine" : "text-ink-mute"}`}>{STEP_LABEL[st]}</span>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-5 text-sm text-ink-soft">Payment: {paymentMethodLabel(o.payment_method)} — <span className="text-ink">{statusLabel(o.payment_status)}</span></p>
      </section>

      {/* Payment actions */}
      {o.payment_method === "upi" && o.payment_status === "awaiting_verification" && o.order_status !== "cancelled" && (
        <section className="mt-6 rounded-2xl border border-wine/30 bg-white p-6">
          <h2 className="text-2xl">Complete your UPI payment</h2>
          <p className="mt-2 text-ink-soft">Pay <strong className="text-wine">{formatINR(o.total)}</strong> using any UPI app. Write <strong>{o.order_number}</strong> in the payment note.</p>
          <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            {s.upi_qr_url && <Image src={s.upi_qr_url} alt="UPI QR code for payment" width={200} height={278} className="rounded-lg border border-ink/10" />}
            <div className="space-y-3 text-[15px]">
              {s.upi_id && <p>UPI ID: <span className="select-all font-medium">{s.upi_id}</span></p>}
              {s.upi_payee_name && <p className="text-ink-soft">Name shown: {s.upi_payee_name}</p>}
              {upiLink && <a href={upiLink} className="btn-primary sm:hidden">Open UPI app</a>}
              <p className="text-sm text-ink-mute">We check every payment manually and confirm your order on WhatsApp or phone.</p>
            </div>
          </div>
          <UpiReferenceForm token={o.public_token} existing={o.upi_reference} />
        </section>
      )}
      {o.payment_method === "razorpay" && o.payment_status !== "paid" && o.order_status !== "cancelled" && (
        <section className="mt-6 rounded-2xl border border-wine/30 bg-white p-6">
          <h2 className="text-2xl">Payment not completed</h2>
          <p className="mt-2 mb-4 text-ink-soft">Your order is saved, but we have not received the payment yet. If money was deducted, it will be confirmed automatically within a few minutes — please don&apos;t pay twice.</p>
          <RazorpayRetry token={o.public_token} />
        </section>
      )}

      {/* Items */}
      <section className="mt-6 rounded-2xl border border-zari/30 bg-white p-6">
        <h2 className="text-2xl">Items</h2>
        <ul className="mt-4 divide-y divide-ink/10">
          {o.items?.map((it) => (
            <li key={it.id} className="flex gap-3 py-3">
              <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded bg-ivory-deep"><ProductImage src={it.image_url} alt="" sizes="56px" /></div>
              <div className="flex-1 text-sm"><p>{it.product_name}</p><p className="text-ink-mute">Qty {it.quantity} × {formatINR(it.unit_price)}</p></div>
              <span className="text-sm">{formatINR(it.line_total)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-ink/10 pt-3 text-[15px]">
          <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{formatINR(o.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-soft">Delivery</dt><dd>{Number(o.shipping_fee) ? formatINR(o.shipping_fee) : "Free"}</dd></div>
          <div className="flex justify-between text-lg"><dt>Total</dt><dd className="font-medium text-wine">{formatINR(o.total)}</dd></div>
        </dl>
        <p className="mt-5 text-sm text-ink-soft">Delivering to: {o.address}, {o.city}, {o.state} {o.pincode}</p>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <a href={whatsappLink(s.whatsapp_number, `Hi ${s.business_name}, I have a question about my order ${o.order_number}.`)} target="_blank" rel="noopener noreferrer" className="btn-wa"><WhatsAppIcon />Ask about this order</a>
        <Link href="/shop" className="btn-outline">Continue shopping</Link>
      </div>
    </div>
  );
}
