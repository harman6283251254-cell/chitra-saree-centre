"use client";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { saveProduct } from "@/app/admin/actions";
import { discountPercent, formatINR } from "@/lib/format";
import Icon from "@/components/Icon";
import type { Category, NamedItem, Product, Subcategory } from "@/lib/types";

type Img = { key: string; url: string | null; storage_path: string | null; preview: string; status: "done" | "uploading" | "error"; error?: string };

/** Shrinks phone photos (often 4–8 MB) to a sharp 1600px JPG so the website loads fast. */
async function compress(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (blob) return blob;
  } catch { /* fall back to original */ }
  return file;
}

export default function ProductForm({ product, categories, subcategories, fabrics, works }: {
  product?: Product; categories: Category[]; subcategories: Subcategory[]; fabrics: NamedItem[]; works: NamedItem[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const initialImgs = [...(product?.images ?? [])].sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order);
  const [images, setImages] = useState<Img[]>(initialImgs.map((i) => ({ key: i.id, url: i.url, storage_path: i.storage_path, preview: i.url, status: "done" })));
  const [mainIndex, setMainIndex] = useState(0);
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [mrp, setMrp] = useState(product ? String(product.mrp) : "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const subs = useMemo(() => subcategories.filter((s) => s.category_id === categoryId), [subcategories, categoryId]);
  const off = discountPercent(Number(price), Number(mrp));
  const uploading = images.some((i) => i.status === "uploading");

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = 10 - images.length;
    const list = Array.from(files).slice(0, room);
    if (files.length > room) alert("You can add up to 10 photos per product.");
    const fresh: Img[] = list.map((f) => ({ key: crypto.randomUUID(), url: null, storage_path: null, preview: URL.createObjectURL(f), status: "uploading" }));
    setImages((prev) => [...prev, ...fresh]);
    await Promise.all(list.map(async (file, i) => {
      const key = fresh[i].key;
      try {
        if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) && file.type) throw new Error("Only photos (JPG, PNG, WebP) are allowed");
        const blob = await compress(file);
        const fd = new FormData();
        fd.append("file", blob, "photo.jpg");
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "Upload failed");
        setImages((prev) => prev.map((im) => (im.key === key ? { ...im, url: d.url, storage_path: d.path, status: "done" } : im)));
      } catch (e) {
        setImages((prev) => prev.map((im) => (im.key === key ? { ...im, status: "error", error: (e as Error).message } : im)));
      }
    }));
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setMainIndex((m) => (idx === m ? 0 : idx < m ? m - 1 : m));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const done = images.filter((i) => i.status === "done" && i.url);
    const doneMain = Math.max(0, done.indexOf(images[mainIndex]));
    setSaving(true);
    const r = await saveProduct(product?.id ?? null, {
      name: String(fd.get("name") ?? ""), sku: String(fd.get("sku") ?? ""),
      category_id: String(fd.get("category_id") ?? ""), subcategory_id: String(fd.get("subcategory_id") ?? ""),
      fabric_id: String(fd.get("fabric_id") ?? ""), work_type_id: String(fd.get("work_type_id") ?? ""),
      description: String(fd.get("description") ?? ""),
      mrp: Number(mrp || 0), price: Number(price || 0), stock: Number(fd.get("stock") || 0),
      is_available: fd.get("is_available") === "yes",
      is_featured: fd.get("is_featured") === "on", is_new_arrival: fd.get("is_new_arrival") === "on", is_best_seller: fd.get("is_best_seller") === "on",
      tags: String(fd.get("tags") ?? "").split(",").map((t) => t.trim()).filter(Boolean),
      images: done.map((i) => ({ url: i.url!, storage_path: i.storage_path })),
      main_index: doneMain,
    } as never);
    if (!r.ok) { setError(r.error); setSaving(false); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    router.push(`/admin/products?saved=${r.id}`);
    router.refresh();
  }

  const box = "rounded-xl border border-ink/10 bg-white p-5 sm:p-6";
  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-28">
      {error && <p className="rounded-lg bg-wine/10 px-4 py-3 text-wine" role="alert">{error}</p>}

      <section className={box}>
        <h2 className="text-2xl">Photos</h2>
        <p className="mt-1 text-sm text-ink-mute">Add up to 10 photos. Tap the star to choose the main photo customers see first.</p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((im, i) => (
            <div key={im.key} className={`relative aspect-[3/4] overflow-hidden rounded-lg border-2 bg-ivory-deep ${i === mainIndex ? "border-zari" : "border-transparent"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.preview} alt="" className="h-full w-full object-cover" />
              {im.status === "uploading" && <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm">Uploading…</div>}
              {im.status === "error" && <div className="absolute inset-0 flex items-center justify-center bg-white/85 p-2 text-center text-xs text-wine">{im.error}</div>}
              <button type="button" onClick={() => removeImage(i)} aria-label="Remove photo" className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1.5 text-wine shadow"><Icon name="close" className="h-4 w-4" /></button>
              {im.status === "done" && (
                <button type="button" onClick={() => setMainIndex(i)} className={`absolute inset-x-1.5 bottom-1.5 rounded-full py-1 text-xs ${i === mainIndex ? "bg-zari text-white" : "bg-white/90 text-ink"}`}>
                  {i === mainIndex ? "★ Main photo" : "Set as main"}
                </button>
              )}
            </div>
          ))}
          {images.length < 10 && (
            <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-wine/30 text-wine hover:bg-wine/5">
              <Icon name="upload" className="h-7 w-7" /><span className="text-sm">Upload photos</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </section>

      <section className={box}>
        <h2 className="text-2xl">Product details</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label" htmlFor="name">Product name</label><input id="name" name="name" required maxLength={160} defaultValue={product?.name} className="field text-lg" placeholder="e.g. Red Banarasi Silk Saree" /></div>
          <div><label className="label" htmlFor="category_id">Category</label>
            <select id="category_id" name="category_id" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field">
              <option value="">Choose category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div><label className="label" htmlFor="subcategory_id">Type</label>
            <select id="subcategory_id" name="subcategory_id" defaultValue={product?.subcategory_id ?? ""} key={categoryId} className="field" disabled={!subs.length}>
              <option value="">{categoryId ? "Choose type" : "Choose a category first"}</option>{subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
          <div><label className="label" htmlFor="fabric_id">Fabric</label>
            <select id="fabric_id" name="fabric_id" defaultValue={product?.fabric_id ?? ""} className="field">
              <option value="">Choose fabric</option>{fabrics.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select></div>
          <div><label className="label" htmlFor="work_type_id">Work</label>
            <select id="work_type_id" name="work_type_id" defaultValue={product?.work_type_id ?? ""} className="field">
              <option value="">Choose work</option>{works.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={5} maxLength={4000} defaultValue={product?.description} className="field" placeholder="Colour, fabric feel, work details, blouse piece, occasion…" /></div>
        </div>
      </section>

      <section className={box}>
        <h2 className="text-2xl">Price & stock</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div><label className="label" htmlFor="mrp">MRP (₹)</label><input id="mrp" required inputMode="decimal" value={mrp} onChange={(e) => setMrp(e.target.value.replace(/[^\d.]/g, ""))} className="field text-lg" placeholder="3999" /></div>
          <div><label className="label" htmlFor="price">Selling price (₹)</label><input id="price" required inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} className="field text-lg" placeholder="2999" />
            {price && mrp && (Number(price) > Number(mrp) ? <p className="mt-1 text-sm text-wine">Selling price cannot be more than MRP</p>
              : <p className="mt-1 text-sm text-ink-mute">{off > 0 ? `Customers see ${off}% off (save ${formatINR(Number(mrp) - Number(price))})` : "No discount shown"}</p>)}</div>
          <div><label className="label" htmlFor="stock">Stock quantity</label><input id="stock" name="stock" required inputMode="numeric" pattern="\d*" defaultValue={product?.stock ?? 1} className="field text-lg" /></div>
          <fieldset className="sm:col-span-3">
            <legend className="label">Can customers buy it?</legend>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 rounded-lg border border-ink/15 px-4 py-2.5"><input type="radio" name="is_available" value="yes" defaultChecked={product?.is_available ?? true} className="accent-wine" />Available</label>
              <label className="flex items-center gap-2 rounded-lg border border-ink/15 px-4 py-2.5"><input type="radio" name="is_available" value="no" defaultChecked={product ? !product.is_available : false} className="accent-wine" />Out of stock / hide from sale</label>
            </div>
          </fieldset>
        </div>
      </section>

      <section className={box}>
        <h2 className="text-2xl">Show on homepage</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {([["is_featured", "Featured product", product?.is_featured], ["is_new_arrival", "New arrival", product?.is_new_arrival ?? true], ["is_best_seller", "Best seller", product?.is_best_seller]] as const).map(([n, l, v]) => (
            <label key={n} className="flex items-center gap-2.5 rounded-lg border border-ink/15 px-4 py-2.5"><input type="checkbox" name={n} defaultChecked={!!v} className="h-4 w-4 accent-wine" />{l}</label>
          ))}
        </div>
        <details className="mt-5">
          <summary className="cursor-pointer text-sm text-wine">More options (product code, search words)</summary>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div><label className="label" htmlFor="sku">Product code</label><input id="sku" name="sku" maxLength={40} defaultValue={product?.sku} className="field" placeholder="Leave empty to create automatically" /></div>
            <div><label className="label" htmlFor="tags">Search words (separate with commas)</label><input id="tags" name="tags" defaultValue={product?.tags?.join(", ")} className="field" placeholder="wedding, red, bridal" /></div>
          </div>
        </details>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/95 px-4 py-3 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 sm:px-2">
          {uploading && <span className="text-sm text-ink-mute">Waiting for photos to finish uploading…</span>}
          <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={saving || uploading} className="btn-primary px-10 py-3.5 text-base">{saving ? "Saving…" : "Save product"}</button>
        </div>
      </div>
    </form>
  );
}
