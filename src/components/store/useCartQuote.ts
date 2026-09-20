"use client";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";

export type Quote = {
  shipping: { fee: number; freeAbove: number | null };
  payments: { cod: boolean; upi: boolean; razorpay: "test" | "live" | "off" };
};

/** Refreshes cart prices/stock from the server so the customer always sees current prices. */
export function useCartQuote() {
  const { items, ready, replace } = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [changed, setChanged] = useState<string[]>([]);
  const idsKey = items.map((i) => i.id).sort().join(",");

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: items.map((i) => i.id) }) })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.products) return;
        const notes: string[] = [];
        const next = items.flatMap((it) => {
          const p = d.products.find((x: { id: string }) => x.id === it.id);
          if (!p || p.stock <= 0) { notes.push(`${it.name} is no longer available and was removed.`); return []; }
          if (p.price !== it.price) notes.push(`The price of ${p.name} is now ₹${p.price.toLocaleString("en-IN")}.`);
          const qty = Math.min(it.qty, p.stock, 20);
          if (qty < it.qty) notes.push(`Only ${p.stock} of ${p.name} available — quantity updated.`);
          return [{ ...it, name: p.name, price: p.price, mrp: p.mrp, image: p.image, slug: p.slug, maxStock: p.stock, qty }];
        });
        if (notes.length) { replace(next); setChanged(notes); }
        setQuote({ shipping: d.shipping, payments: d.payments });
      })
      .catch(() => { /* keep cart as is */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, idsKey]);

  return { quote, changed };
}

export function shippingFor(subtotal: number, q: Quote | null) {
  if (!q) return 0;
  if (q.shipping.freeAbove && subtotal >= q.shipping.freeAbove) return 0;
  return q.shipping.fee;
}
