import { requireAdmin } from "@/lib/auth";
import { PageTitle } from "@/components/admin/ui";
import CategoryManager from "@/components/admin/CategoryManager";
import type { Category, NamedItem, Subcategory } from "@/lib/types";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const { sb } = await requireAdmin();
  const [c, s, f, w, counts] = await Promise.all([
    sb.from("categories").select("*").order("sort_order"),
    sb.from("subcategories").select("*").order("sort_order").order("name"),
    sb.from("fabrics").select("id,name,sort_order").order("sort_order").order("name"),
    sb.from("work_types").select("id,name,sort_order").order("sort_order").order("name"),
    sb.from("products").select("category_id"),
  ]);
  const productCount: Record<string, number> = {};
  for (const p of counts.data ?? []) if (p.category_id) productCount[p.category_id] = (productCount[p.category_id] ?? 0) + 1;
  return (
    <>
      <PageTitle title="Categories & types" />
      <p className="-mt-4 mb-6 max-w-2xl text-ink-mute">Add or remove categories, product types, fabrics and work styles. Changes appear on your website and in the Add-product form straight away.</p>
      <CategoryManager categories={(c.data ?? []) as Category[]} subcategories={(s.data ?? []) as Subcategory[]}
        fabrics={(f.data ?? []) as NamedItem[]} works={(w.data ?? []) as NamedItem[]} productCount={productCount} />
    </>
  );
}
