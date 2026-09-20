import Link from "next/link";
import type { Metadata } from "next";
import { getCategories, getLookups } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Categories", description: "All categories of ethnic wear at Chitra Saree Centre." };

export default async function CategoriesPage() {
  const [cats, { subcategories }] = await Promise.all([getCategories(), getLookups()]);
  return (
    <div className="page pt-10">
      <h1 className="font-display text-4xl sm:text-5xl">Categories</h1>
      <div className="mt-10 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c) => (
          <section key={c.id} className="border-t border-zari/40 pt-5">
            <h2 className="text-3xl"><Link href={`/category/${c.slug}`} className="hover:text-wine">{c.name}</Link></h2>
            <ul className="mt-4 space-y-2">
              {subcategories.filter((s) => s.category_id === c.id).map((s) => (
                <li key={s.id}><Link href={`/category/${c.slug}?sub=${s.id}`} className="text-ink-soft hover:text-wine">{s.name}</Link></li>
              ))}
            </ul>
            <Link href={`/category/${c.slug}`} className="mt-4 inline-block text-sm text-wine underline underline-offset-4">See all {c.name.toLowerCase()}</Link>
          </section>
        ))}
      </div>
    </div>
  );
}
