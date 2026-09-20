import { requireAdmin } from "@/lib/auth";
import { formatDate, formatINR, intlPhone } from "@/lib/format";
import { Card, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Customers" };

type Row = { id: string; name: string; phone: string; email: string | null; city: string | null; state: string | null; created_at: string; orders: { total: number; order_status: string; created_at: string }[] };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { sb } = await requireAdmin();
  const { q = "" } = await searchParams;
  let req = sb.from("customers").select("id,name,phone,email,city,state,created_at, orders(total,order_status,created_at)").order("updated_at", { ascending: false }).limit(300);
  const term = q.replace(/[^\w\s@.-]/g, "").trim();
  if (term) req = req.or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
  const { data } = await req;
  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageTitle title="Customers" />
      <p className="-mt-4 mb-6 max-w-2xl text-ink-mute">Everyone who has placed an order on your website. Customers are saved automatically when they order.</p>
      <form className="mb-5 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search name, phone or email" className="field max-w-md" />
        <button className="btn-outline">Search</button>
      </form>
      {rows.length === 0 ? (
        <Card><p className="py-8 text-center text-ink-mute">No customers yet.</p></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => {
            const valid = c.orders.filter((o) => o.order_status !== "cancelled");
            const spent = valid.reduce((s, o) => s + Number(o.total), 0);
            const last = c.orders.map((o) => o.created_at).sort().at(-1);
            return (
              <div key={c.id} className="rounded-xl border border-ink/10 bg-white p-5">
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-ink-mute">{[c.city, c.state].filter(Boolean).join(", ")}</p>
                <p className="mt-3 text-sm">{c.orders.length} order(s) · {formatINR(spent)}{last ? ` · last ${formatDate(last)}` : ""}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={`tel:+${intlPhone(c.phone)}`} className="btn-outline py-1.5 text-sm">{c.phone}</a>
                  <a href={`https://wa.me/${intlPhone(c.phone)}`} target="_blank" rel="noopener noreferrer" className="btn-wa py-1.5 text-sm">WhatsApp</a>
                  <a href={`/admin/orders?q=${c.phone}`} className="btn-ghost py-1.5 text-sm">Orders</a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
