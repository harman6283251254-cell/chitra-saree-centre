"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string; slug: string; name: string; sku: string; price: number; mrp: number;
  image: string | null; qty: number; maxStock: number;
};
type CartCtx = {
  items: CartItem[]; count: number; subtotal: number; ready: boolean;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  replace: (items: CartItem[]) => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "csc-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id);
      const limit = Math.min(item.maxStock, 20);
      if (found) return prev.map((p) => (p.id === item.id ? { ...p, ...item, qty: Math.min(p.qty + qty, limit) } : p));
      return [...prev, { ...item, qty: Math.min(qty, limit) }];
    });
  }, []);
  const setQty = useCallback((id: string, qty: number) =>
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty: Math.max(1, Math.min(qty, p.maxStock, 20)) } : p))), []);
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((p) => p.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const replace = useCallback((next: CartItem[]) => setItems(next), []);

  const value = useMemo(() => ({
    items, ready, add, setQty, remove, clear, replace,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.qty * i.price, 0),
  }), [items, ready, add, setQty, remove, clear, replace]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
