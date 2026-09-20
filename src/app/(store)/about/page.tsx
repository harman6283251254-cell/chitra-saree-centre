import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "About us", description: "About Chitra Saree Centre — sarees, suits, lehengas and ethnic wear." };

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <div className="page max-w-3xl pt-12">
      <Image src="/logo.jpg" alt="Chitra Saree Centre logo" width={200} height={200} className="h-36 w-36 rounded-full" />
      <h1 className="mt-8 font-display text-5xl">About {s.business_name}</h1>
      {s.tagline && <p className="mt-3 font-display text-2xl italic text-zari">{s.tagline}</p>}
      <div className="mt-6 space-y-4 font-display text-xl leading-relaxed text-ink">
        {(s.store_description ?? "").split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
      </div>
      <p className="mt-8 leading-relaxed text-ink-soft">
        We carry sarees, suits, lehengas, shararas, ghararas and kurta pajamas — in pure fabrics and with handwork, threadwork,
        gota patti and kadhai work. Browse online, or visit the store to see every piece in person.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/shop" className="btn-primary">Browse the collection</Link>
        <Link href="/contact" className="btn-outline">Contact & location</Link>
      </div>
    </div>
  );
}
