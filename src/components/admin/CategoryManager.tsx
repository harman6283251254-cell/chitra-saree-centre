"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCategory, deleteLookup, deleteSubcategory, saveCategory, saveLookup, saveSubcategory, setCategoryVisible } from "@/app/admin/actions";
import type { Category, NamedItem, Subcategory } from "@/lib/types";
import Icon from "@/components/Icon";

type R = { ok: true } | { ok: false; error: string };

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<R>, after?: () => void) => start(async () => {
    const r = await fn();
    if (!r.ok) alert(r.error); else { after?.(); router.refresh(); }
  });
  return { pending, run };
}

function AddInline({ placeholder, onAdd, pending }: { placeholder: string; onAdd: (v: string, reset: () => void) => void; pending: boolean }) {
  const [v, setV] = useState("");
  return (
    <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (v.trim()) onAdd(v, () => setV("")); }}>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} maxLength={60} className="field py-2" />
      <button className="btn-outline shrink-0 py-2" disabled={pending || !v.trim()}><Icon name="plus" className="h-4 w-4" />Add</button>
    </form>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-ivory py-1 pl-3 pr-1 text-sm">
      {label}
      <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="rounded-full p-1 text-ink-mute hover:bg-wine/10 hover:text-wine"><Icon name="close" className="h-3.5 w-3.5" /></button>
    </span>
  );
}

export default function CategoryManager({ categories, subcategories, fabrics, works, productCount }: {
  categories: Category[]; subcategories: Subcategory[]; fabrics: NamedItem[]; works: NamedItem[]; productCount: Record<string, number>;
}) {
  const { pending, run } = useRun();
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-2xl">Main categories</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {categories.map((c) => {
            const subs = subcategories.filter((s) => s.category_id === c.id);
            return (
              <div key={c.id} className={`rounded-xl border bg-white p-5 ${c.is_active ? "border-ink/10" : "border-dashed border-ink/25 opacity-75"}`}>
                {editing === c.id ? (
                  <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); run(() => saveCategory(c.id, editName, editDesc), () => setEditing(null)); }}>
                    <input className="field" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={60} aria-label="Category name" />
                    <input className="field" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} maxLength={200} placeholder="Short description (optional)" aria-label="Description" />
                    <div className="flex gap-2"><button className="btn-primary py-2" disabled={pending}>Save</button><button type="button" className="btn-ghost py-2" onClick={() => setEditing(null)}>Cancel</button></div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-2xl">{c.name}{!c.is_active && <span className="ml-2 align-middle font-sans text-xs text-ink-mute">(hidden from website)</span>}</h3>
                      <p className="text-sm text-ink-mute">{productCount[c.id] ?? 0} product(s)</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button className="p-2 text-ink-mute hover:text-wine" aria-label={`Rename ${c.name}`} onClick={() => { setEditing(c.id); setEditName(c.name); setEditDesc(c.description ?? ""); }}><Icon name="edit" className="h-5 w-5" /></button>
                      <button className="rounded-md px-2 text-sm text-ink-soft hover:text-wine" disabled={pending} onClick={() => run(() => setCategoryVisible(c.id, !c.is_active))}>{c.is_active ? "Hide" : "Show"}</button>
                      <button className="p-2 text-ink-mute hover:text-wine" aria-label={`Delete ${c.name}`} disabled={pending}
                        onClick={() => confirm(`Delete the category "${c.name}"?`) && run(() => deleteCategory(c.id))}><Icon name="trash" className="h-5 w-5" /></button>
                    </div>
                  </div>
                )}
                <p className="mt-4 text-sm font-medium text-ink-soft">Types in {c.name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {subs.length ? subs.map((s) => <Chip key={s.id} label={s.name} onRemove={() => confirm(`Remove "${s.name}"? Products using it will keep their category.`) && run(() => deleteSubcategory(s.id))} />)
                    : <span className="text-sm text-ink-mute">No types yet.</span>}
                </div>
                <AddInline placeholder={`New type, e.g. "Festive ${c.name}"`} pending={pending} onAdd={(v, reset) => run(() => saveSubcategory(c.id, v), reset)} />
              </div>
            );
          })}
        </div>
        <div className="mt-4 max-w-md rounded-xl border border-dashed border-ink/20 bg-white p-5">
          <p className="font-medium">Add a new main category</p>
          <AddInline placeholder="e.g. Dupattas" pending={pending} onAdd={(v, reset) => run(() => saveCategory(null, v, ""), reset)} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {([["fabrics", "Fabrics", fabrics, "e.g. Georgette"], ["work_types", "Work / embroidery", works, "e.g. Zari work"]] as const).map(([table, title, list, ph]) => (
          <section key={table} className="rounded-xl border border-ink/10 bg-white p-5">
            <h2 className="text-2xl">{title}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {list.map((x) => <Chip key={x.id} label={x.name} onRemove={() => confirm(`Remove "${x.name}"? Products using it will show no ${title.toLowerCase()}.`) && run(() => deleteLookup(table, x.id))} />)}
            </div>
            <AddInline placeholder={ph} pending={pending} onAdd={(v, reset) => run(() => saveLookup(table, v), reset)} />
          </section>
        ))}
      </div>
    </div>
  );
}
