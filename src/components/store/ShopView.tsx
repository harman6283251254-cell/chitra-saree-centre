import { getCategories, getLookups, getProducts, type ProductQuery } from "@/lib/data";
import { ProductGrid } from "./ProductCard";
import FilterForm, { SortSelect } from "./FilterForm";
import Icon from "@/components/Icon";

type SP = Record<string, string | string[] | undefined>;
const pick = (sp: SP) => Object.fromEntries(
  ["q", "category", "sub", "fabric", "work", "min", "max", "stock", "sort", "flag"].map((k) => [k, typeof sp[k] === "string" ? (sp[k] as string).slice(0, 80) : ""]),
) as Record<string, string>;

export default async function ShopView({ sp, fixedCategory }: { sp: SP; fixedCategory?: string }) {
  const values = pick(sp);
  if (fixedCategory) values.category = fixedCategory;
  const flag = (["featured", "new", "best"] as const).find((f) => f === values.flag);
  const [categories, lookups, products] = await Promise.all([
    getCategories(), getLookups(),
    getProducts({ ...(values as ProductQuery), flag, limit: 120 }),
  ]);
  const cat = categories.find((c) => c.slug === values.category);
  const subs = cat ? lookups.subcategories.filter((s) => s.category_id === cat.id) : [];
  const title = cat?.name ?? (flag === "featured" ? "Featured" : flag === "new" ? "New arrivals" : flag === "best" ? "Best sellers" : values.q ? `Results for “${values.q}”` : "All products");
  const action = fixedCategory ? `/category/${fixedCategory}` : "/shop";

  const filter = (
    <FilterForm action={action} values={values} showCategory={!fixedCategory}
      categories={categories.map((c) => ({ value: c.slug, label: c.name }))}
      subcategories={subs.map((s) => ({ value: s.id, label: s.name }))}
      fabrics={lookups.fabrics.map((f) => ({ value: f.id, label: f.name }))}
      works={lookups.works.map((w) => ({ value: w.id, label: w.name }))} />
  );

  return (
    <div className="page pt-8 md:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zari/25 pb-5">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
          {cat?.description && <p className="mt-2 text-ink-soft">{cat.description}</p>}
          <p className="mt-1 text-sm text-ink-mute">{products.length} {products.length === 1 ? "product" : "products"}</p>
        </div>
        <SortSelect value={values.sort} />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        <details className="rounded-xl border border-ink/10 bg-white lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[15px] text-wine">
            <span className="flex items-center gap-2"><Icon name="search" className="h-4 w-4" />Filter products</span>
            <Icon name="plus" className="h-4 w-4" />
          </summary>
          <div className="border-t border-ink/10 p-4">{filter}</div>
        </details>
        <aside className="hidden lg:block" aria-label="Filters"><div className="sticky top-28">{filter}</div></aside>

        <div>
          {products.length ? <ProductGrid products={products} eager={4} /> : (
            <div className="rounded-2xl border border-dashed border-zari/50 px-6 py-16 text-center">
              <p className="font-display text-2xl text-wine-deep">No products match these filters</p>
              <p className="mt-2 text-ink-soft">Try removing a filter, or ask us on WhatsApp — we may have it in the store.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
