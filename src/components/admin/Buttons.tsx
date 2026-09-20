"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteDemoProducts, deleteProduct, updateStock } from "@/app/admin/actions";
import Icon from "@/components/Icon";

export function DeleteDemoButton({ count }: { count: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button className="btn-outline py-2 text-sm" disabled={pending} onClick={() => {
      if (!confirm(`Delete all ${count} demo products? Your real products are not affected.`)) return;
      start(async () => { const r = await deleteDemoProducts(); if (!r.ok) alert(r.error); router.refresh(); });
    }}>{pending ? "Deleting…" : "Delete all demo products"}</button>
  );
}

export function DeleteProductButton({ id, name, compact }: { id: string; name: string; compact?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button className={compact ? "p-2 text-ink-mute hover:text-wine" : "btn-ghost text-wine"} disabled={pending} aria-label={`Delete ${name}`}
      onClick={() => {
        if (!confirm(`Delete "${name}"? This removes it from the website. Past orders keep their details.`)) return;
        start(async () => { const r = await deleteProduct(id); if (!r.ok) alert(r.error); else router.refresh(); });
      }}>
      <Icon name="trash" className="h-5 w-5" />{!compact && (pending ? "Deleting…" : "Delete")}
    </button>
  );
}

export function StockEditor({ id, stock }: { id: string; stock: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(stock));
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const dirty = value !== String(stock);
  return (
    <form className="flex items-center gap-1.5" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        const r = await updateStock(id, Number(value));
        if (!r.ok) alert(r.error); else { setSaved(true); setTimeout(() => setSaved(false), 1500); router.refresh(); }
      });
    }}>
      <input value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))} inputMode="numeric" aria-label="Stock quantity"
        className="w-16 rounded-md border border-ink/15 px-2 py-1.5 text-center" />
      {dirty && <button className="rounded-md bg-wine px-2.5 py-1.5 text-sm text-white" disabled={pending}>{pending ? "…" : "Save"}</button>}
      {saved && <Icon name="check" className="h-4 w-4 text-[#1F7A45]" />}
    </form>
  );
}
