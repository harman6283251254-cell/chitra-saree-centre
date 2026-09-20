"use client";
import { useRouter } from "next/navigation";
import { useRef } from "react";

type Opt = { value: string; label: string };
export default function FilterForm({ action, values, categories, subcategories, fabrics, works, showCategory }: {
  action: string; values: Record<string, string>; showCategory: boolean;
  categories: Opt[]; subcategories: Opt[]; fabrics: Opt[]; works: Opt[];
}) {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const go = () => {
    const fd = new FormData(ref.current!);
    const params = new URLSearchParams();
    fd.forEach((v, k) => { if (typeof v === "string" && v.trim()) params.set(k, v.trim()); });
    router.push(`${action}${params.size ? "?" + params.toString() : ""}`);
  };
  const sel = (name: string, label: string, opts: Opt[], anyLabel: string) => (
    <div>
      <label className="label" htmlFor={`f-${name}`}>{label}</label>
      <select id={`f-${name}`} name={name} defaultValue={values[name] ?? ""} onChange={go} className="field py-2">
        <option value="">{anyLabel}</option>
        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
  return (
    <form ref={ref} onSubmit={(e) => { e.preventDefault(); go(); }} className="space-y-4" key={JSON.stringify(values)}>
      <div>
        <label className="label" htmlFor="f-q">Search</label>
        <input id="f-q" name="q" type="search" defaultValue={values.q ?? ""} placeholder="e.g. banarasi silk" className="field py-2" maxLength={80} />
      </div>
      {showCategory && sel("category", "Category", categories, "All categories")}
      {subcategories.length > 0 && sel("sub", "Type", subcategories, "All types")}
      {sel("fabric", "Fabric", fabrics, "Any fabric")}
      {sel("work", "Work", works, "Any work")}
      <div>
        <span className="label">Price (₹)</span>
        <div className="flex items-center gap-2">
          <input name="min" type="number" inputMode="numeric" min={0} placeholder="Min" defaultValue={values.min ?? ""} className="field py-2" aria-label="Minimum price" />
          <span className="text-ink-mute">to</span>
          <input name="max" type="number" inputMode="numeric" min={0} placeholder="Max" defaultValue={values.max ?? ""} className="field py-2" aria-label="Maximum price" />
        </div>
      </div>
      <label className="flex items-center gap-2.5 text-[15px] text-ink">
        <input type="checkbox" name="stock" value="in" defaultChecked={values.stock === "in"} onChange={go} className="h-4 w-4 accent-wine" />
        In stock only
      </label>
      {values.flag && <input type="hidden" name="flag" value={values.flag} />}
      <input type="hidden" name="sort" value={values.sort ?? ""} />
      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary flex-1 py-2.5">Apply</button>
        <button type="button" onClick={() => router.push(action)} className="btn-ghost py-2.5">Clear</button>
      </div>
    </form>
  );
}

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  return (
    <select aria-label="Sort products" defaultValue={value} className="field w-auto py-2 pr-8 text-[15px]"
      onChange={(e) => {
        const u = new URL(window.location.href);
        if (e.target.value) u.searchParams.set("sort", e.target.value); else u.searchParams.delete("sort");
        router.push(u.pathname + u.search);
      }}>
      <option value="">Newest</option>
      <option value="price_asc">Price: low to high</option>
      <option value="price_desc">Price: high to low</option>
      <option value="popular">Popular</option>
    </select>
  );
}
