import { requireAdmin } from "@/lib/auth";
import ProductForm from "@/components/admin/ProductForm";
import { PageTitle } from "@/components/admin/ui";
import type { Category, NamedItem, Subcategory } from "@/lib/types";

export const metadata = { title: "Add product" };

export async function loadLookups() {
  const { sb } = await requireAdmin();
  const [c, s, f, w] = await Promise.all([
    sb.from("categories").select("*").order("sort_order"), sb.from("subcategories").select("*").order("sort_order"),
    sb.from("fabrics").select("*").order("sort_order"), sb.from("work_types").select("*").order("sort_order"),
  ]);
  return { sb, categories: (c.data ?? []) as Category[], subcategories: (s.data ?? []) as Subcategory[], fabrics: (f.data ?? []) as NamedItem[], works: (w.data ?? []) as NamedItem[] };
}

export default async function NewProduct() {
  const { categories, subcategories, fabrics, works } = await loadLookups();
  return (
    <>
      <PageTitle title="Add new product" back={{ href: "/admin/products", label: "Products" }} />
      <ProductForm categories={categories} subcategories={subcategories} fabrics={fabrics} works={works} />
    </>
  );
}
