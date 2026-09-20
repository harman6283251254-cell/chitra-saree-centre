import Link from "next/link";
import Image from "next/image";
import { getCategories, getProducts, getSettings } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { mainImage } from "@/lib/format";
import { ProductGrid } from "@/components/store/ProductCard";
import ProductImage from "@/components/store/ProductImage";
import VisitStore from "@/components/store/VisitStore";
import SetupNotice from "@/components/store/SetupNotice";
import Icon from "@/components/Icon";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const REASONS = [
  { icon: "sparkle", title: "Quality ethnic wear", text: "Pure fabrics with handwork, threadwork, gota patti and kadhai work." },
  { icon: "heart", title: "Designs for every occasion", text: "From everyday suits to bridal lehengas and wedding wear." },
  { icon: "store", title: "A store you can visit", text: "See the colour and feel the fabric in person before you decide." },
  { icon: "grid", title: "Wide variety", text: "Sarees, suits, lehengas, shararas, ghararas and kurta pajamas." },
  { icon: "chat", title: "Talk to a real person", text: "Call or WhatsApp us about any product, size or order." },
];

function Section({ title, href, products }: { title: string; href: string; products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="page mt-20" aria-label={title}>
      <div className="mb-7 flex items-end justify-between gap-4">
        <h2 className="section-title">{title}</h2>
        <Link href={href} className="shrink-0 text-[15px] text-wine underline-offset-4 hover:underline">View all</Link>
      </div>
      <ProductGrid products={products.slice(0, 4)} />
    </section>
  );
}

export default async function HomePage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const [s, categories, all] = await Promise.all([getSettings(), getCategories(), getProducts({ limit: 80 })]);
  const featured = all.filter((p) => p.is_featured);
  const newArrivals = all.filter((p) => p.is_new_arrival);
  const bestSellers = all.filter((p) => p.is_best_seller);
  const heroProduct = featured.find((p) => mainImage(p.images)) ?? all.find((p) => mainImage(p.images));
  const heroImg = heroProduct ? mainImage(heroProduct.images) : null;
  const catImage = (id: string) => {
    const c = categories.find((x) => x.id === id);
    if (c?.image_url) return c.image_url;
    const p = all.find((x) => x.category_id === id && mainImage(x.images));
    return p ? mainImage(p.images) : null;
  };

  return (
    <>
      {/* HERO — a pallu-inspired panel with the jharokha arch */}
      <section className="relative overflow-hidden bg-wine text-ivory">
        <div className="page grid items-center gap-10 py-12 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div className="max-w-xl">
            <p className="font-display text-xl italic text-zari-light">{s.tagline || "Tradition. Elegance. You."}</p>
            <h1 className="mt-4 font-display text-[44px] font-medium leading-[1.02] text-ivory sm:text-6xl lg:text-7xl">
              Elegance that defines you
            </h1>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-ivory/80">
              Discover sarees, suits, lehengas and ethnic wear chosen for weddings, parties and every celebration, at Chitra Saree Centre.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/shop" className="btn bg-ivory text-wine hover:bg-white">Shop the collection</Link>
              <Link href="/contact" className="btn border border-ivory/40 text-ivory hover:bg-ivory/10">Visit our store</Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[380px]">
            <div className="absolute -inset-3 rounded-t-[999px] rounded-b-lg border border-zari/60" aria-hidden />
            <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-md bg-wine-deep">
              {heroImg ? (
                <ProductImage src={heroImg} alt={heroProduct!.name} priority sizes="(max-width: 768px) 90vw, 380px" />
              ) : (
                <Image src="/logo.jpg" alt="Chitra Saree Centre" fill priority sizes="380px" className="object-cover" />
              )}
            </div>
            {heroProduct && (
              <Link href={`/product/${heroProduct.slug}`} className="relative mx-auto -mt-6 block w-fit rounded-full bg-ivory px-5 py-2 text-sm text-wine shadow-md shadow-ink/20">
                {heroProduct.name}
              </Link>
            )}
          </div>
        </div>
        <div className="zari-band" />
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="page mt-16" aria-labelledby="cat-heading">
          <h2 id="cat-heading" className="section-title">Shop by category</h2>
          <div className="no-scrollbar -mx-4 mt-7 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {categories.map((c) => {
              const img = catImage(c.id);
              return (
                <Link key={c.id} href={`/category/${c.slug}`} className="group w-[40%] shrink-0 snap-start sm:w-auto">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-md border border-zari/40 bg-wine">
                    {img ? <ProductImage src={img} alt="" sizes="(max-width: 640px) 40vw, 16vw" className="transition-transform duration-500 group-hover:scale-105" />
                      : <div className="flex h-full items-center justify-center font-display text-4xl text-zari-light">{c.name[0]}</div>}
                  </div>
                  <p className="mt-3 text-center font-display text-xl text-wine-deep">{c.name}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <Section title="Featured" href="/shop?flag=featured" products={featured} />
      <Section title="New arrivals" href="/shop?flag=new" products={newArrivals} />
      <Section title="Best sellers" href="/shop?sort=popular" products={bestSellers} />

      {all.length === 0 && (
        <section className="page mt-20 text-center">
          <h2 className="section-title">Our collection is being added</h2>
          <p className="mx-auto mt-3 max-w-md text-ink-soft">New pieces will appear here soon. Call or WhatsApp us to ask about what is in the store today.</p>
        </section>
      )}

      {/* WHY CHOOSE US */}
      <section className="mt-24 border-y border-zari/25 bg-white py-16" aria-labelledby="why-heading">
        <div className="page">
          <h2 id="why-heading" className="section-title max-w-lg">Why shop with Chitra Saree Centre</h2>
          <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
            {REASONS.map((r) => (
              <li key={r.title}>
                <Icon name={r.icon} className="h-7 w-7 text-zari" />
                <h3 className="mt-3 font-sans text-base font-medium text-ink">{r.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{r.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ABOUT */}
      <section className="page mt-20 grid items-center gap-10 md:grid-cols-[auto_1fr]" aria-labelledby="about-heading">
        <Image src="/logo.jpg" alt="Chitra Saree Centre logo" width={260} height={260} className="mx-auto h-44 w-44 rounded-full md:h-64 md:w-64" />
        <div className="max-w-2xl">
          <h2 id="about-heading" className="section-title">About the store</h2>
          <p className="mt-4 font-display text-xl leading-relaxed text-ink">{s.store_description}</p>
          <Link href="/about" className="mt-6 inline-block text-wine underline underline-offset-4">Read more about us</Link>
        </div>
      </section>

      <div className="mt-20"><VisitStore s={s} /></div>
    </>
  );
}
