import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { PageTitle } from "@/components/admin/ui";
import { DeleteProductButton } from "@/components/admin/Buttons";
import { PRODUCT_SELECT } from "@/lib/data";
import { loadLookups } from "../../new/page";
import type { Product } from "@/lib/types";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { sb, ...lookups } = await loadLookups();
  const { data } = await sb.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  if (!data) notFound();
  const p = data as unknown as Product;
  return (
    <>
      <PageTitle title={`Edit: ${p.name}`} back={{ href: "/admin/products", label: "Products" }}
        action={<div className="flex gap-2"><a href={`/product/${p.slug}`} target="_blank" className="btn-outline py-2">View on website</a><DeleteProductButton id={p.id} name={p.name} /></div>} />
      <ProductForm product={p} {...lookups} />
    </>
  );
}
