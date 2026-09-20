import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { formatDate, formatINR } from "@/lib/format";
import { Card, OrderBadge, PayBadge } from "@/components/admin/ui";
import { DeleteDemoButton } from "@/components/admin/Buttons";
import Icon from "@/components/Icon";
import type { Order } from "@/lib/types";

export default async function Dashboard() {
  const { sb } = await requireAdmin();
  const s = await getSettings();
  const [products, orders, lowStock, demo, revenueRows, recent, attention] = await Promise.all([
    sb.from("products").select("id", { count: "exact", head: true }),
    sb.from("orders").select("id", { count: "exact", head: true }),
    sb.from("products").select("id,name,stock", { count: "exact" }).lte("stock", s.low_stock_threshold).order("stock").limit(6),
    sb.from("products").select("id", { count: "exact", head: true }).eq("is_demo", true),
    sb.from("orders").select("total,payment_method,payment_status,order_status").neq("order_status", "cancelled"),
    sb.from("orders").select("*").order("created_at", { ascending: false }).limit(6),
    sb.from("orders").select("id", { count: "exact", head: true }).or("order_status.eq.pending,payment_status.eq.awaiting_verification"),
  ]);
  const revenue = (revenueRows.data ?? [])
    .filter((o) => o.payment_status === "paid" || (o.payment_method === "cod" && o.order_status === "delivered"))
    .reduce((sum, o) => sum + Number(o.total), 0);

  const stats = [
    { label: "Products", value: products.count ?? 0, href: "/admin/products" },
    { label: "Orders", value: orders.count ?? 0, href: "/admin/orders" },
    { label: "Low stock", value: lowStock.count ?? 0, href: "/admin/products?stock=low" },
    { label: "Revenue received", value: formatINR(revenue), href: "/admin/orders" },
  ];

  return (
    <>
      <p className="text-ink-mute">Welcome,</p>
      <h1 className="font-display text-4xl sm:text-5xl">{s.business_name}</h1>

      <Link href="/admin/products/new" className="btn-primary mt-6 w-full py-4 text-lg sm:w-auto sm:px-10">
        <Icon name="plus" className="h-5 w-5" />Add product
      </Link>

      {(demo.count ?? 0) > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zari/50 bg-zari-pale/40 px-5 py-4">
          <p className="text-[15px]">Your website shows <strong>{demo.count} demo products</strong>. Delete them once you have added your own.</p>
          <DeleteDemoButton count={demo.count ?? 0} />
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((st) => (
          <Link key={st.label} href={st.href} className="rounded-xl border border-ink/10 bg-white p-5 hover:border-zari">
            <p className="text-sm text-ink-mute">{st.label}</p>
            <p className="mt-1 font-display text-3xl text-wine-deep sm:text-4xl">{st.value}</p>
          </Link>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-mute">Revenue counts paid orders and delivered cash-on-delivery orders.</p>

      {(attention.count ?? 0) > 0 && (
        <Link href="/admin/orders?status=pending" className="mt-6 flex items-center justify-between rounded-xl bg-wine px-5 py-4 text-ivory hover:bg-wine-deep">
          <span><strong>{attention.count}</strong> order{attention.count === 1 ? "" : "s"} need your attention</span>
          <span>Open orders</span>
        </Link>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="flex items-center justify-between"><h2 className="text-2xl">Latest orders</h2><Link href="/admin/orders" className="text-sm text-wine">All orders</Link></div>
          {recent.data?.length ? (
            <ul className="mt-4 divide-y divide-ink/10">
              {(recent.data as Order[]).map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:text-wine">
                    <span className="font-medium">{o.order_number}</span>
                    <span className="text-ink-soft">{o.customer_name}</span>
                    <span className="ml-auto">{formatINR(o.total)}</span>
                    <span className="flex w-full gap-2 sm:w-auto"><OrderBadge status={o.order_status} /><PayBadge status={o.payment_status} /></span>
                    <span className="w-full text-xs text-ink-mute">{formatDate(o.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-ink-soft">No orders yet. When a customer orders, it will appear here.</p>}
        </Card>
        <Card>
          <div className="flex items-center justify-between"><h2 className="text-2xl">Low stock</h2><Link href="/admin/products?stock=low" className="text-sm text-wine">See all</Link></div>
          {lowStock.data?.length ? (
            <ul className="mt-4 divide-y divide-ink/10">
              {lowStock.data.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-3">
                  <Link href={`/admin/products/${p.id}/edit`} className="hover:text-wine">{p.name}</Link>
                  <span className={p.stock === 0 ? "text-wine" : "text-[#A0561A]"}>{p.stock === 0 ? "Out" : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-ink-soft">All products are well stocked.</p>}
        </Card>
      </div>
    </>
  );
}
