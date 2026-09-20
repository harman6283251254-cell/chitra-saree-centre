import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { whatsappLink } from "@/lib/whatsapp";
import VisitStore from "@/components/store/VisitStore";
import Icon, { WhatsAppIcon } from "@/components/Icon";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact us & store location", description: "Call, WhatsApp or email Chitra Saree Centre, or visit our store." };

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <div className="pt-12">
      <div className="page max-w-3xl">
        <h1 className="font-display text-5xl">Contact us</h1>
        <p className="mt-3 text-lg text-ink-soft">Ask about a product, check availability, or get help with an order. We reply fastest on WhatsApp.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {s.phone_primary && <a href={`tel:+91${s.phone_primary}`} className="btn-primary"><Icon name="phone" className="h-4 w-4" />Call now</a>}
          {s.whatsapp_number && <a href={whatsappLink(s.whatsapp_number, `Hi ${s.business_name}, I have a question.`)} target="_blank" rel="noopener noreferrer" className="btn-wa"><WhatsAppIcon />Chat on WhatsApp</a>}
          {s.email && <a href={`mailto:${s.email}`} className="btn-outline"><Icon name="mail" className="h-4 w-4" />Email us</a>}
        </div>
        <dl className="mt-10 grid gap-6 border-t border-zari/30 pt-8 sm:grid-cols-2">
          <div><dt className="text-sm text-ink-mute">Phone</dt><dd className="mt-1 space-y-1">{[s.phone_primary, s.phone_secondary].filter(Boolean).map((p) => <a key={p} href={`tel:+91${p}`} className="block text-lg text-wine">+91 {p}</a>)}</dd></div>
          <div><dt className="text-sm text-ink-mute">WhatsApp</dt><dd className="mt-1 text-lg text-wine">+91 {s.whatsapp_number}</dd></div>
          <div><dt className="text-sm text-ink-mute">Email</dt><dd className="mt-1 break-all text-lg text-wine">{s.email}</dd></div>
          {s.instagram_url && <div><dt className="text-sm text-ink-mute">Instagram</dt><dd className="mt-1"><a href={s.instagram_url} target="_blank" rel="noopener noreferrer" className="text-lg text-wine">@chitrasareecentre</a></dd></div>}
        </dl>
      </div>
      <div className="mt-16"><VisitStore s={s} /></div>
    </div>
  );
}
