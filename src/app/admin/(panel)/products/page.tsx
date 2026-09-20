import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSettings, PRODUCT_SELECT } from "@/lib/data";
import { formatINR, mainImage, stockState } from "@/lib/format";
import { PageTitle, StockBadge } from "@/components/admin/ui";
import { DeleteProductButton, StockEditor } from "@/components/admin/Buttons";
import ProductImage from "@/components/store/ProductImage";
import Icon from "@/components/Icon";
import type { Product } from "@/lib/types";

export const metadata = { title: "Products" };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { sb } = await requireAdmin();
  const s = await getSettings();
  let q = sb.from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false }).limit(500);
  const words = (sp.q ?? "").toLowerCase().replace(/[%_,()*\\]/g, " ").split(/\s+/).filter(Boolean).slice(0, 6);
  for (const w of words) q = q.ilike("search_text", `%${w}%`);
  if (sp.stock === "low") q = q.lte("stock", s.low_stock_threshold);
  const { data } = await q;
  const products = (data ?? []) as unknown as Product[];
  const saved = sp.saved ? products.find((p) => p.id === sp.saved) : null;

  return (
    <>
      <PageTitle title="Products" action={<Link href="/admin/products/new" className="btn-primary"><Icon name="plus" className="h-4 w-4" />Add product</Link>} />

      {saved && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1F7A45]/30 bg-[#E4F3EA] px-5 py-4">
          <p><strong>{saved.name}</strong> is saved and live on the website.</p>
          <div className="flex gap-2">
            <a href={`/product/${saved.slug}`} target="_blank" className="btn-outline bg-white py-2 text-sm">View on website</a>
            <Link href={`/admin/social/instagram?product=${saved.id}`} className="btn-primary py-2 text-sm"><Icon name="instagram" className="h-4 w-4" />Create Instagram post</Link>
          </div>
        </div>
      )}

      <form className="mb-5 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search by name, code, fabric…" className="field max-w-sm" />
        <select name="stock" defaultValue={sp.stock ?? ""} className="field w-auto"><option value="">All stock</option><option value="low">Low / out of stock</option></select>
        <button className="btn-outline py-2">Search</button>
      </form>

      {!products.length ? (
        <div className="rounded-xl border border-dashed border-ink/20 bg-white px-6 py-14 text-center">
          <p className="text-lg">{sp.q || sp.stock ? "No products match your search." : "You have no products yet."}</p>
          <Link href="/admin/products/new" className="btn-primary mt-5">Add your first product</Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
          <table className="w-full text-left text-[15px]">
            <thead className="hidden border-b border-ink/10 bg-ivory text-sm text-ink-mute md:table-header-group">
              <tr><th className="px-4 py-3 font-normal">Product</th><th className="px-4 py-3 font-normal">Category</th><th className="px-4 py-3 font-normal">Price</th><th className="px-4 py-3 font-normal">Stock</th><th className="px-4 py-3 font-normal">Status</th><th className="px-4 py-3 text-right font-normal">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {products.map((p) => {
                const st = stockState(p, s.low_stock_threshold);
                return (
                  <tr key={p.id} className="grid grid-cols-[64px_1fr] gap-x-3 gap-y-2 p-4 md:table-row md:p-0">
                    <td className="row-span-4 md:px-4 md:py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded bg-ivory-deep md:w-12"><ProductImage src={mainImage(p.images)} alt="" sizes="64px" /></div>
                        <div className="hidden md:block"><p className="font-medium">{p.name}</p><p className="text-xs text-ink-mute">{p.sku}{p.is_demo && " · Demo"}</p></div>
                      </div>
                    </td>
                    <td className="md:hidden"><p className="font-medium">{p.name}</p><p className="text-xs text-ink-mute">{p.sku}{p.is_demo && " · Demo"} · {p.category?.name ?? "No category"}</p></td>
                    <td className="hidden text-ink-soft md:table-cell md:px-4">{p.category?.name ?? "—"}</td>
                    <td className="md:px-4"><span className="text-wine">{formatINR(p.price)}</span>{Number(p.mrp) > Number(p.price) && <span className="ml-2 text-xs text-ink-mute line-through">{formatINR(p.mrp)}</span>}</td>
                    <td className="md:px-4"><StockEditor id={p.id} stock={p.stock} /></td>
                    <td className="col-start-2 md:px-4"><StockBadge state={st} stock={p.stock} />{!p.is_available && <p className="mt-1 text-xs text-ink-mute">Hidden from sale</p>}</td>
                    <td className="col-span-2 md:px-4 md:text-right">
                      <div className="flex items-center gap-1 md:justify-end">
                        <Link href={`/admin/products/${p.id}/edit`} className="btn-outline px-4 py-1.5 text-sm"><Icon name="edit" className="h-4 w-4" />Edit</Link>
                        <a href={`/product/${p.slug}`} target="_blank" className="btn-ghost px-3 py-1.5 text-sm"><Icon name="eye" className="h-4 w-4" />View</a>
                        <DeleteProductButton id={p.id} name={p.name} compact />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
