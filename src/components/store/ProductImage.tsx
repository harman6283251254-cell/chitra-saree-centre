import Image from "next/image";

/** Product photo with lazy loading + automatic resizing (Supabase photos) and a graceful fallback. */
export default function ProductImage({ src, alt, sizes, priority, className = "" }: {
  src: string | null; alt: string; sizes: string; priority?: boolean; className?: string;
}) {
  if (!src) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-ivory-deep text-sm text-ink-mute ${className}`}>
        Photo coming soon
      </div>
    );
  }
  return (
    <Image src={src} alt={alt} fill sizes={sizes} priority={priority}
      unoptimized={src.endsWith(".svg")} className={`object-cover ${className}`} />
  );
}
