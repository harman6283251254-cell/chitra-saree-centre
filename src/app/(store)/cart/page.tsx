"use client";
import Link from "next/link";
import { useCart } from "@/components/store/CartProvider";
import { shippingFor, useCartQuote } from "@/components/store/useCartQuote";
import ProductImage from "@/components/store/ProductImage";
import Icon from "@/components/Icon";
import { formatINR } from "@/lib/format";

export default function CartPage() {
  const { items, subtotal, setQty, remove, ready } = useCart();
  const { quote, changed } = useCartQuote();
  const shipping = shippingFor(subtotal, quote);

  if (!ready) return <div className="page py-20 text-ink-mute">Loading your cart…</div>;
  if (!items.length) {
    return (
      <div className="page py-20 text-center">
        <h1 className="font-display text-4xl">Your cart is empty</h1>
        <p className="mt-3 text-ink-soft">Browse the collection and add the pieces you love.</p>
        <Link href="/shop" className="btn-primary mt-8">Start shopping</Link>
      </div>
    );
  }
  return (
    <div className="page pb-28 pt-10 lg:pb-0">
      <h1 className="font-display text-4xl sm:text-5xl">Your cart</h1>
      {changed.length > 0 && (
        <div className="mt-5 rounded-lg border border-zari/50 bg-zari-pale/50 px-4 py-3 text-sm text-ink" role="status">
          {changed.map((c) => <p key={c}>{c}</p>)}
        </div>
      )}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {items.map((it) => (
            <li key={it.id} className="flex gap-4 py-5">
              <Link href={`/product/${it.slug}`} className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-md bg-ivory-deep sm:w-28">
                <ProductImage src={it.image} alt={it.name} sizes="112px" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <Link href={`/product/${it.slug}`} className="text-ink hover:text-wine">{it.name}</Link>
                  <button onClick={() => remove(it.id)} className="h-fit p-1 text-ink-mute hover:text-wine" aria-label={`Remove ${it.name}`}><Icon name="trash" className="h-5 w-5" /></button>
                </div>
                <p className="mt-1 text-sm text-ink-mute">{formatINR(it.price)} each</p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-full border border-ink/15 bg-white">
                    <button className="p-2 text-wine disabled:opacity-30" disabled={it.qty <= 1} onClick={() => setQty(it.id, it.qty - 1)} aria-label="Decrease quantity"><Icon name="minus" className="h-4 w-4" /></button>
                    <span className="w-7 text-center tabular-nums">{it.qty}</span>
                    <button className="p-2 text-wine disabled:opacity-30" disabled={it.qty >= Math.min(it.maxStock, 20)} onClick={() => setQty(it.id, it.qty + 1)} aria-label="Increase quantity"><Icon name="plus" className="h-4 w-4" /></button>
                  </div>
                  <span className="font-medium text-wine">{formatINR(it.price * it.qty)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-zari/30 bg-white p-6 lg:sticky lg:top-28">
          <h2 className="text-2xl">Order summary</h2>
          <dl className="mt-5 space-y-2.5 text-[15px]">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Delivery</dt><dd>{shipping ? formatINR(shipping) : "Free"}</dd></div>
            <div className="flex justify-between border-t border-ink/10 pt-3 text-lg"><dt>Total</dt><dd className="font-medium text-wine">{formatINR(subtotal + shipping)}</dd></div>
          </dl>
          <Link href="/checkout" className="btn-primary mt-6 hidden w-full lg:flex">Proceed to checkout</Link>
          <p className="mt-4 flex items-center gap-2 text-xs text-ink-mute"><Icon name="shield" className="h-4 w-4" />Secure checkout</p>
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-zari/30 bg-ivory/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex-1"><p className="text-xs text-ink-mute">Total</p><p className="text-lg font-medium text-wine">{formatINR(subtotal + shipping)}</p></div>
        <Link href="/checkout" className="btn-primary">Checkout</Link>
      </div>
    </div>
  );
}
