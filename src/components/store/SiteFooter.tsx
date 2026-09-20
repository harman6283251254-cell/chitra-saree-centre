import Link from "next/link";
import Image from "next/image";
import type { Category, Settings } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";
import Icon, { WhatsAppIcon } from "@/components/Icon";

export default function SiteFooter({ s, categories }: { s: Settings; categories: Category[] }) {
  return (
    <footer className="mt-24 bg-wine-deep text-ivory/85">
      <div className="zari-band-dark" />
      <div className="page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/logo-sm.jpg" alt="" width={52} height={52} className="rounded-full" />
            <div>
              <div className="font-display text-3xl text-ivory">Chitra</div>
              <div className="text-[11px] tracking-[0.28em] text-zari-light">SAREE CENTRE</div>
            </div>
          </div>
          {s.tagline && <p className="mt-4 font-display text-lg italic text-zari-light">{s.tagline}</p>}
          {s.store_description && <p className="mt-3 max-w-xs text-sm leading-relaxed text-ivory/70">{s.store_description}</p>}
        </div>

        <div>
          <h2 className="font-sans text-sm font-medium text-zari-light">Shop</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {categories.map((c) => <li key={c.id}><Link href={`/category/${c.slug}`} className="hover:text-white">{c.name}</Link></li>)}
            <li><Link href="/shop" className="hover:text-white">All products</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="font-sans text-sm font-medium text-zari-light">Help</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/track-order" className="hover:text-white">Track your order</Link></li>
            <li><Link href="/policies" className="hover:text-white">Returns, refunds & shipping</Link></li>
            <li><Link href="/about" className="hover:text-white">About us</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact & store location</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="font-sans text-sm font-medium text-zari-light">Talk to us</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {[s.phone_primary, s.phone_secondary].filter(Boolean).map((p) => (
              <li key={p}><a href={`tel:+91${p}`} className="flex items-center gap-2 hover:text-white"><Icon name="phone" className="h-4 w-4" />+91 {p}</a></li>
            ))}
            {s.whatsapp_number && (
              <li><a href={whatsappLink(s.whatsapp_number, `Hi ${s.business_name}`)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white"><WhatsAppIcon className="h-4 w-4" />WhatsApp +91 {s.whatsapp_number}</a></li>
            )}
            {s.email && <li><a href={`mailto:${s.email}`} className="flex items-center gap-2 break-all hover:text-white"><Icon name="mail" className="h-4 w-4 shrink-0" />{s.email}</a></li>}
            {s.maps_url && <li><a href={s.maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white"><Icon name="pin" className="h-4 w-4" />Find our store on Google Maps</a></li>}
            {s.instagram_url && <li><a href={s.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white"><Icon name="instagram" className="h-4 w-4" />@chitrasareecentre</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="page flex flex-col gap-2 py-5 text-xs text-ivory/55 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} {s.business_name}. All rights reserved.</span>
          <span>Payments are processed by secure payment providers. We never store card or UPI details.</span>
        </div>
      </div>
    </footer>
  );
}
