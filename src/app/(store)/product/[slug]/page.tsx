import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts, getSettings } from "@/lib/data";
import { discountPercent, formatINR, mainImage, sortedImages, stockLabel, stockState } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { SITE_URL } from "@/lib/env";
import ProductGallery from "@/components/store/ProductGallery";
import AddToCart from "@/components/store/AddToCart";
import { ProductGrid } from "@/components/store/ProductCard";
import Icon, { WhatsAppIcon } from "@/components/Icon";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return { title: "Product not found" };
  const img = mainImage(p.images);
  const desc = (p.description || `${p.name} at Chitra Saree Centre`).slice(0, 155);
  return {
    title: p.name,
    description: desc,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.name, description: desc, images: img && !img.endsWith(".svg") ? [img] : ["/logo.jpg"] },
    robots: p.is_demo ? { index: false } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [p, s] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!p) notFound();

  const related = (await getProducts({ category: p.category?.slug, excludeId: p.id, limit: 8 })).slice(0, 4);
  const images = sortedImages(p.images).map((i) => i.url);
  const off = discountPercent(p.price, p.mrp);
  const state = stockState(p, s.low_stock_threshold);
  const url = `${SITE_URL}/product/${p.slug}`;
  const waMsg = `Hi ${s.business_name}, I am interested in ${p.name} (${p.sku}, ${formatINR(p.price)}). Is it available?\n${url}`;

  const details: [string, string | undefined | null][] = [
    ["Category", [p.category?.name, p.subcategory?.name].filter(Boolean).join(" / ")],
    ["Fabric", p.fabric?.name], ["Work", p.work_type?.name], ["Product code", p.sku],
  ];

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, sku: p.sku,
    description: p.description, image: images.filter((i) => !i.endsWith(".svg")).map((i) => (i.startsWith("/") ? SITE_URL + i : i)),
    brand: { "@type": "Brand", name: s.business_name },
    offers: {
      "@type": "Offer", priceCurrency: "INR", price: Number(p.price), url,
      availability: state === "out" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <div className="page pb-24 pt-6 sm:pb-0 md:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="mb-6 text-sm text-ink-mute" aria-label="Breadcrumb">
        <Link href="/shop" className="hover:text-wine">Shop</Link>
        {p.category && <> <span aria-hidden>/</span> <Link href={`/category/${p.category.slug}`} className="hover:text-wine">{p.category.name}</Link></>}
      </nav>

      <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
        <ProductGallery images={images} name={p.name} />

        <div>
          {p.is_demo && (
            <p className="mb-4 rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink-soft">
              This is a demo listing that shows how products appear. It is not a real item from the store.
            </p>
          )}
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">{p.name}</h1>
          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-medium text-wine">{formatINR(p.price)}</span>
            {off > 0 && <>
              <span className="text-lg text-ink-mute line-through">MRP {formatINR(p.mrp)}</span>
              <span className="rounded-full bg-wine/10 px-3 py-1 text-sm text-wine">{off}% off</span>
            </>}
          </div>
          <p className="mt-1 text-sm text-ink-mute">Inclusive of all taxes</p>

          <p className={`mt-5 inline-flex items-center gap-2 text-[15px] ${state === "out" ? "text-ink-mute" : state === "low" ? "text-[#A0561A]" : "text-[#1F7A45]"}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {state === "low" ? `Only ${p.stock} left` : stockLabel[state]}
          </p>

          <div className="mt-6">
            <AddToCart available={state !== "out"} item={{
              id: p.id, slug: p.slug, name: p.name, sku: p.sku, price: Number(p.price), mrp: Number(p.mrp),
              image: mainImage(p.images), maxStock: p.stock,
            }} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a href={whatsappLink(s.whatsapp_number, waMsg)} target="_blank" rel="noopener noreferrer" className="btn-wa"><WhatsAppIcon />Chat on WhatsApp</a>
            <button disabled className="btn-outline" title="Coming soon">
              <Icon name="sparkle" className="h-4 w-4" />Virtual try-on <span className="text-xs">(coming soon)</span>
            </button>
          </div>

          {p.description && (
            <section className="mt-10">
              <h2 className="text-2xl">Description</h2>
              <div className="prose-shop mt-3 text-ink-soft">{p.description.split(/\n+/).map((para, i) => <p key={i}>{para}</p>)}</div>
            </section>
          )}

          <section className="mt-8">
            <h2 className="text-2xl">Details</h2>
            <dl className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
              {details.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-3 text-[15px]"><dt className="text-ink-mute">{k}</dt><dd className="text-right text-ink">{v}</dd></div>
              ))}
            </dl>
          </section>

          <ul className="mt-8 space-y-3 text-sm text-ink-soft">
            <li className="flex gap-3"><Icon name="shield" className="h-5 w-5 shrink-0 text-zari" />Secure checkout. We never see or store your card or UPI details.</li>
            <li className="flex gap-3"><Icon name="truck" className="h-5 w-5 shrink-0 text-zari" />Delivery across India. <Link href="/policies" className="underline">Returns & shipping info</Link></li>
            <li className="flex gap-3"><Icon name="phone" className="h-5 w-5 shrink-0 text-zari" />Questions? Call <a href={`tel:+91${s.phone_primary}`} className="underline">+91 {s.phone_primary}</a></li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="section-title mb-7">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
