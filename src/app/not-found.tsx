import Link from "next/link";
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-5xl">Page not found</h1>
      <p className="mt-3 text-ink-soft">This page or product may have been removed.</p>
      <Link href="/shop" className="btn-primary mt-8">Browse the collection</Link>
    </div>
  );
}
