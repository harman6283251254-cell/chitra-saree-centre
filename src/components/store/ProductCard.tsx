import Link from "next/link";
import type { Product } from "@/lib/types";
import { discountPercent, formatINR, mainImage, stockState } from "@/lib/format";
import ProductImage from "./ProductImage";

export default function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const off = discountPercent(product.price, product.mrp);
  const state = stockState(product);
  const detail = [product.fabric?.name, product.work_type?.name].filter((x) => x && x !== "Other").join(", ");
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-md bg-ivory-deep">
        <ProductImage src={mainImage(product.images)} alt={product.name} priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute left-2 top-[18%] flex flex-col items-start gap-1.5">
          {product.is_demo && <span className="rounded-full bg-ink/80 px-2.5 py-0.5 text-[11px] text-ivory">Demo</span>}
          {off > 0 && <span className="rounded-full bg-wine px-2.5 py-0.5 text-[11px] text-ivory">{off}% off</span>}
        </div>
        {state === "out" && (
          <div className="absolute inset-x-0 bottom-0 bg-ivory/90 py-2 text-center text-sm text-ink-soft">Out of stock</div>
        )}
      </div>
      <div className="pt-3">
        <h3 className="font-sans text-[15px] font-normal leading-snug text-ink line-clamp-2 group-hover:text-wine">{product.name}</h3>
        {detail && <p className="mt-0.5 text-[13px] text-ink-mute">{detail}</p>}
        <p className="mt-1.5 flex items-baseline gap-2">
          <span className="font-medium text-wine">{formatINR(product.price)}</span>
          {off > 0 && <span className="text-[13px] text-ink-mute line-through">{formatINR(product.mrp)}</span>}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products, eager = 0 }: { products: Product[]; eager?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < eager} />)}
    </div>
  );
}
