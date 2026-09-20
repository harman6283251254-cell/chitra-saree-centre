import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatINR, paymentMethodLabel, intlPhone } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/types";
import { Card, OrderBadge, PageTitle, PayBadge } from "@/components/admin/ui";
import OrderControls from "@/components/admin/OrderControls";
import { whatsappConfigured } from "@/lib/whatsapp-server";

export const metadata = { title: "Order details" };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { sb } = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await sb.from("orders").select("*, items:order_items(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const o = data as Order & { items: OrderItem[] };
  const { data: log } = await sb.from("notification_log").select("id,template,status,created_at").eq("order_id", id).order("created_at", { ascending: false }).limit(10);

  return (
    <>
      <PageTitle title={`Order #${o.order_number}`} back={{ href: "/admin/orders", label: "All orders" }}
        action={<div className="flex gap-2"><OrderBadge status={o.order_status} /><PayBadge status={o.payment_status} /></div>} />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-2xl">Items</h2>
            <ul className="mt-4 divide-y divide-ink/10">
              {o.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3">
                  {i.image_url ? <img src={i.image_url} alt="" className="h-16 w-12 rounded object-cover" /> : <div className="h-16 w-12 rounded bg-blush" />}
                  <div className="flex-1">
                    <p className="font-medium">{i.product_name}</p>
                    <p className="text-sm text-ink-mute">{i.sku ? `Code ${i.sku} · ` : ""}{formatINR(i.unit_price)} × {i.quantity}</p>
                  </div>
                  <span className="font-medium">{formatINR(i.line_total)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-ink/10 pt-4 text-[15px]">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(o.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Shipping</dt><dd>{Number(o.shipping_fee) ? formatINR(o.shipping_fee) : "Free"}</dd></div>
              <div className="flex justify-between text-lg font-medium"><dt>Total</dt><dd>{formatINR(o.total)}</dd></div>
            </dl>
          </Card>
          <Card>
            <h2 className="text-2xl">Customer & delivery address</h2>
            <p className="mt-3 font-medium">{o.customer_name}</p>
            <p className="whitespace-pre-line text-ink-soft">{o.address}{"\n"}{o.city}, {o.state} – {o.pincode}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`tel:+${intlPhone(o.phone)}`} className="btn-outline py-2 text-sm">Call {o.phone}</a>
              <a href={`https://wa.me/${intlPhone(o.phone)}?text=${encodeURIComponent(`Hello ${o.customer_name}, this is regarding your order #${o.order_number}.`)}`} target="_blank" rel="noopener noreferrer" className="btn-wa py-2 text-sm">WhatsApp customer</a>
              {o.email && <a href={`mailto:${o.email}`} className="btn-ghost py-2 text-sm">{o.email}</a>}
            </div>
            {o.notes && <p className="mt-4 rounded-lg bg-ivory p-3 text-sm"><strong>Customer note:</strong> {o.notes}</p>}
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <h2 className="text-2xl">Update this order</h2>
            <OrderControls id={o.id} orderStatus={o.order_status} paymentStatus={o.payment_status} whatsappLive={whatsappConfigured()} />
          </Card>
          <Card>
            <h2 className="text-2xl">Payment</h2>
            <dl className="mt-3 space-y-2 text-[15px]">
              <div className="flex justify-between gap-3"><dt className="text-ink-mute">Method</dt><dd>{paymentMethodLabel(o.payment_method)}</dd></div>
              {o.upi_reference && <div className="flex justify-between gap-3"><dt className="text-ink-mute">UPI reference (UTR)</dt><dd className="font-mono">{o.upi_reference}</dd></div>}
              {o.razorpay_payment_id && <div className="flex justify-between gap-3"><dt className="text-ink-mute">Razorpay payment</dt><dd className="break-all font-mono text-sm">{o.razorpay_payment_id}</dd></div>}
              <div className="flex justify-between gap-3"><dt className="text-ink-mute">Placed on</dt><dd>{formatDate(o.created_at)}</dd></div>
            </dl>
            {o.payment_status === "awaiting_verification" && (
              <p className="mt-4 rounded-lg bg-[#FCE9DC] p-3 text-sm">The customer says they paid by UPI. Open your UPI / bank app, check that {formatINR(o.total)} arrived with the reference above, then mark the payment as <strong>Paid</strong>.</p>
            )}
          </Card>
          <Card>
            <h2 className="text-2xl">WhatsApp messages</h2>
            {log?.length ? (
              <ul className="mt-3 space-y-1 text-sm">{log.map((l) => <li key={l.id} className="flex justify-between gap-2"><span>{l.template}</span><span className="text-ink-mute">{l.status} · {formatDate(l.created_at)}</span></li>)}</ul>
            ) : <p className="mt-2 text-sm text-ink-mute">No messages yet.</p>}
            <Link href="/admin/social" className="mt-3 inline-block text-sm text-wine">WhatsApp settings</Link>
          </Card>
        </div>
      </div>
    </>
  );
}
