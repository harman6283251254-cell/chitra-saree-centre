import { requireAdmin } from "@/lib/auth";
import { getSettings, PRODUCT_SELECT } from "@/lib/data";
import { instagramConfigured } from "@/lib/instagram-server";
import { generateCaption } from "@/lib/instagram";
import { SITE_URL } from "@/lib/env";
import { mainImage, sortedImages } from "@/lib/format";
import type { Product } from "@/lib/types";
import { PageTitle } from "@/components/admin/ui";
import InstagramComposer from "@/components/admin/InstagramComposer";

export const metadata = { title: "Create Instagram post" };

export default async function InstagramPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { sb } = await requireAdmin();
  const { product: pid } = await searchParams;
  const s = await getSettings();
  const { data: list } = await sb.from("products").select("id,name").order("created_at", { ascending: false }).limit(300);
  let product: Product | null = null;
  if (pid && /^[0-9a-f-]{36}$/i.test(pid)) {
    const { data } = await sb.from("products").select(PRODUCT_SELECT).eq("id", pid).maybeSingle();
    product = (data as Product | null) ?? null;
  }
  const toAbs = (u: string) => (u.startsWith("/") ? SITE_URL + u : u);
  return (
    <>
      <PageTitle title="Create Instagram post" back={{ href: "/admin/social", label: "Social media" }} />
      <InstagramComposer
        products={list ?? []}
        selectedId={product?.id ?? ""}
        initialCaption={product ? generateCaption(product, `${SITE_URL}/product/${product.slug}`, s.business_name) : ""}
        images={product ? sortedImages(product.images).map((i) => toAbs(i.url)) : []}
        mainImageUrl={product && mainImage(product.images) ? toAbs(mainImage(product.images)!) : null}
        productUrl={product ? `${SITE_URL}/product/${product.slug}` : ""}
        connected={instagramConfigured()}
      />
    </>
  );
}
