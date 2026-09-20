"use client";
import { useState } from "react";
import ProductImage from "./ProductImage";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  return (
    <div className="md:sticky md:top-28">
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-lg bg-ivory-deep">
        <ProductImage src={images[active] ?? null} alt={`${name} — photo ${active + 1}`} priority sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto">
          {images.map((src, i) => (
            <button key={src + i} onClick={() => setActive(i)} aria-label={`Show photo ${i + 1}`} aria-current={i === active}
              className={`relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-md border-2 ${i === active ? "border-zari" : "border-transparent opacity-75"}`}>
              <ProductImage src={src} alt="" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
