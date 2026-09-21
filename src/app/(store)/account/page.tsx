import type { Metadata } from "next";
import Link from "next/link";
import { requireCustomerPage } from "@/lib/customer-auth";
import { formatINR, formatDate, statusLabel } from "@/lib/format";
import SignOutButton from "@/components/store/SignOutButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Account" };

export default async function AccountPage() {
  const { user, sb } = await requireCustomerPage();

  const { data: orders } = await sb
    .from("orders")
    .select("id, order_number, public_token, total, order_status, payment_status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="page max-w-3xl py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-wine-deep">My Account</h1>
          <p className="mt-1 text-ink-soft">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <section className="mt-10">
        <h2 className="text-2xl">My Orders</h2>
        {!orders || orders.length === 0 ? (
          <p className="mt-3 text-ink-soft">
            No orders yet. <Link href="/shop" className="text-wine underline">Start shopping</Link>
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/order/${o.public_token}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zari/30 bg-white p-4 hover:border-wine/40">
                  <span>
                    <span className="block text-ink">{o.order_number}</span>
                    <span className="block text-sm text-ink-mute">{formatDate(o.created_at)}</span>
                  </span>
                  <span className="text-sm text-ink-soft">{statusLabel(o.order_status)}</span>
                  <span className="font-medium text-wine">{formatINR(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
