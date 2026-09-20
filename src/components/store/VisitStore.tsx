import type { Settings } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";
import Icon, { WhatsAppIcon } from "@/components/Icon";

export default function VisitStore({ s, headingLevel = "h2" }: { s: Settings; headingLevel?: "h1" | "h2" }) {
  const H = headingLevel;
  const directions = s.store_address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.store_address)}`
    : s.maps_url;
  return (
    <section className="page" aria-labelledby="visit-heading">
      <div className="grid overflow-hidden rounded-2xl border border-zari/30 bg-white md:grid-cols-2">
        <div className="p-7 sm:p-10">
          <H id="visit-heading" className="section-title">Visit our store</H>
          <p className="mt-3 max-w-md leading-relaxed text-ink-soft">
            See the colours and feel the fabric in person. Our team will help you find the right piece for your occasion.
          </p>
          {s.store_address && <p className="mt-5 flex gap-2 text-ink"><Icon name="pin" className="mt-0.5 h-5 w-5 shrink-0 text-zari" />{s.store_address}</p>}
          {s.store_hours && <p className="mt-2 text-sm text-ink-soft">{s.store_hours}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            {s.maps_url && <a href={s.maps_url} target="_blank" rel="noopener noreferrer" className="btn-primary"><Icon name="pin" className="h-4 w-4" />Open in Google Maps</a>}
            {directions && <a href={directions} target="_blank" rel="noopener noreferrer" className="btn-outline">Get directions</a>}
          </div>
        </div>
        <div className="flex flex-col justify-center gap-3 bg-ivory-deep/60 p-7 sm:p-10">
          <p className="text-sm text-ink-mute">Questions before you visit?</p>
          {s.phone_primary && <a href={`tel:+91${s.phone_primary}`} className="flex items-center gap-3 text-lg text-wine hover:underline"><Icon name="phone" />Call +91 {s.phone_primary}</a>}
          {s.phone_secondary && <a href={`tel:+91${s.phone_secondary}`} className="flex items-center gap-3 text-lg text-wine hover:underline"><Icon name="phone" />Call +91 {s.phone_secondary}</a>}
          {s.whatsapp_number && <a href={whatsappLink(s.whatsapp_number, `Hi ${s.business_name}, I would like to visit your store.`)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-lg text-wine hover:underline"><WhatsAppIcon />Chat on WhatsApp</a>}
          {s.email && <a href={`mailto:${s.email}`} className="flex items-center gap-3 break-all text-lg text-wine hover:underline"><Icon name="mail" className="h-5 w-5 shrink-0" />Email us</a>}
        </div>
      </div>
    </section>
  );
}
