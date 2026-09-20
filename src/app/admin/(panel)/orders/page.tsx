import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatINR, paymentMethodLabel, statusLabel } from "@/lib/format";
import { ORDER_STATUSES, type Order } from "@/lib/types";
import { Card, OrderBadge, PageTitle, PayBadge } from "@/components/admin/ui";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { sb } = await requireAdmin();
  const { status = "", q = "" } = await searchParams;
  let req = sb.from("orders").select("*, items:order_items(id,product_name,quantity)").order("created_at", { ascending: false }).limit(200);
  if ((ORDER_STATUSES as readonly string[]).includes(status)) req = req.eq("order_status", status);
  const term = q.replace(/[^\w\s-]/g, "").trim();
  if (term) req = req.or(`order_number.ilike.%${term}%,customer_name.ilike.%${term}%,phone.ilike.%${term}%`);
  const { data } = await req;
  const orders = (data ?? []) as (Order & { items: { id: string; product_name: string; quantity: number }[] })[];

  const tabs = [{ v: "", l: "All" }, ...ORDER_STATUSES.map((s) => ({ v: s, l: statusLabel(s) }))];
  return (
    <>
      <PageTitle title="Orders" />
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link key={t.v} href={t.v ? `/admin/orders?status=${t.v}` : "/admin/orders"}
            className={`rounded-full border px-4 py-1.5 text-sm ${status === t.v ? "border-wine bg-wine text-ivory" : "border-ink/15 bg-white hover:border-wine"}`}>{t.l}</Link>
        ))}
      </div>
      <form className="mb-5 flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder="Search by order number, name or phone" className="field max-w-md" />
        <button className="btn-outline">Search</button>
      </form>

      {orders.length === 0 ? (
        <Card><p className="py-8 text-center text-ink-mute">No orders here yet. New orders from your website will appear here automatically.</p></Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {orders.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="block rounded-xl border border-ink/10 bg-white p-4">
                <div className="flex items-center justify-between"><strong>#{o.order_number}</strong><span className="font-medium">{formatINR(o.total)}</span></div>
                <p className="mt-1 text-sm">{o.customer_name} · {o.phone}</p>
                <p className="text-sm text-ink-mute">{o.items.reduce((s, i) => s + i.quantity, 0)} item(s) · {formatDate(o.created_at)}</p>
                <div className="mt-2 flex flex-wrap gap-2"><OrderBadge status={o.order_status} /><PayBadge status={o.payment_status} /></div>
              </Link>
            ))}
          </div>
          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-xl border border-ink/10 bg-white md:block">
            <table className="w-full text-left text-[15px]">
              <thead className="border-b border-ink/10 bg-ivory text-sm text-ink-mute">
                <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Items</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Status</th><th className="p-3">Date</th></tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-ivory/60">
                    <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-medium text-wine hover:underline">#{o.order_number}</Link></td>
                    <td className="p-3">{o.customer_name}<div className="text-sm text-ink-mute">{o.phone}</div></td>
                    <td className="max-w-[220px] p-3 text-sm">{o.items.map((i) => `${i.product_name} × ${i.quantity}`).join(", ")}</td>
                    <td className="p-3 font-medium">{formatINR(o.total)}</td>
                    <td className="p-3"><PayBadge status={o.payment_status} /><div className="mt-1 text-xs text-ink-mute">{paymentMethodLabel(o.payment_method)}</div></td>
                    <td className="p-3"><OrderBadge status={o.order_status} /></td>
                    <td className="whitespace-nowrap p-3 text-sm text-ink-mute">{formatDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
