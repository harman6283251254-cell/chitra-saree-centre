"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart, type CartItem } from "./CartProvider";
import Icon from "@/components/Icon";
import { formatINR } from "@/lib/format";

export default function AddToCart({ item, available }: { item: Omit<CartItem, "qty">; available: boolean }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const max = Math.min(item.maxStock, 20);

  const onAdd = () => { add(item, qty); setAdded(true); setTimeout(() => setAdded(false), 2200); };
  const onBuy = () => { add(item, qty); router.push("/checkout"); };

  if (!available) {
    return <p className="rounded-lg bg-ivory-deep px-4 py-3 text-ink-soft">This piece is out of stock. Message us on WhatsApp — we can tell you when it is back or suggest something similar.</p>;
  }
  return (
    <>
      <div className="flex items-center gap-4">
        <span className="text-sm text-ink-soft">Quantity</span>
        <div className="flex items-center rounded-full border border-ink/15 bg-white">
          <button className="p-2.5 text-wine disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity"><Icon name="minus" className="h-4 w-4" /></button>
          <span className="w-8 text-center tabular-nums" aria-live="polite">{qty}</span>
          <button className="p-2.5 text-wine disabled:opacity-30" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max} aria-label="Increase quantity"><Icon name="plus" className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="mt-5 hidden gap-3 sm:flex">
        <button onClick={onAdd} className="btn-outline flex-1">{added ? <><Icon name="check" className="h-4 w-4" />Added to cart</> : "Add to cart"}</button>
        <button onClick={onBuy} className="btn-primary flex-1">Buy now</button>
      </div>
      {/* Mobile: sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-zari/30 bg-ivory/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-ink-mute">{item.name}</p>
          <p className="font-medium text-wine">{formatINR(item.price * qty)}</p>
        </div>
        <button onClick={onAdd} className="btn-outline px-4 py-2.5 text-sm">{added ? "Added" : "Add to cart"}</button>
        <button onClick={onBuy} className="btn-primary px-4 py-2.5 text-sm">Buy now</button>
      </div>
    </>
  );
}
