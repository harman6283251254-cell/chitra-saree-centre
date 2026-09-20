"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { saveSettings } from "@/app/admin/actions";
import type { Settings } from "@/lib/types";
import Icon from "@/components/Icon";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
      <h2 className="text-2xl">{title}</h2>
      {hint && <p className="mt-1 text-sm text-ink-mute">{hint}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function F({ name, label, value, type = "text", wide, placeholder, help }: { name: string; label: string; value: string | number | null; type?: string; wide?: boolean; placeholder?: string; help?: string }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} defaultValue={value ?? ""} placeholder={placeholder} className="field" {...(type === "number" ? { min: 0, step: "1", inputMode: "numeric" as const } : {})} />
      {help && <p className="mt-1 text-xs text-ink-mute">{help}</p>}
    </div>
  );
}

function T({ name, label, value, rows = 4, placeholder }: { name: string; label: string; value: string | null; rows?: number; placeholder?: string }) {
  return (
    <div className="sm:col-span-2">
      <label className="label" htmlFor={name}>{label}</label>
      <textarea id={name} name={name} defaultValue={value ?? ""} rows={rows} placeholder={placeholder} className="field" />
    </div>
  );
}

function ImagePicker({ label, url, onChange }: { label: string; url: string | null; onChange: (u: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function upload(file: File) {
    setBusy(true);
    const fd = new FormData(); fd.append("file", file); fd.append("folder", "branding");
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return alert(j.error ?? "Upload failed");
    onChange(j.url);
  }
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-ink/10 bg-ivory">
          {url ? <img src={url} alt="" className="h-full w-full object-contain" /> : <span className="text-xs text-ink-mute">None</span>}
        </div>
        <div className="flex flex-col gap-1">
          <button type="button" className="btn-outline py-2 text-sm" disabled={busy} onClick={() => ref.current?.click()}><Icon name="upload" className="h-4 w-4" />{busy ? "Uploading…" : "Change"}</button>
          {url && <button type="button" className="text-left text-sm text-ink-mute hover:text-wine" onClick={() => onChange(null)}>Remove</button>}
        </div>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
      </div>
    </div>
  );
}

export default function SettingsForm({ settings: s, razorpay }: { settings: Settings; razorpay: "test" | "live" | "off" }) {
  const router = useRouter();
  const [logo, setLogo] = useState(s.logo_url);
  const [qr, setQr] = useState(s.upi_qr_url);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw: Record<string, unknown> = Object.fromEntries(fd.entries());
    raw.cod_enabled = fd.get("cod_enabled") === "on";
    raw.upi_enabled = fd.get("upi_enabled") === "on";
    start(async () => {
      const r = await saveSettings(raw, logo, qr);
      setMsg(r.ok ? { ok: true, text: "Settings saved. Your website is updated." } : { ok: false, text: r.error });
      if (r.ok) router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-24">
      {msg && <p role="status" className={`rounded-lg p-3 ${msg.ok ? "bg-[#E4F3EA] text-[#1F7A45]" : "bg-wine/10 text-wine"}`}>{msg.text}</p>}

      <Section title="Shop details">
        <F name="business_name" label="Business name" value={s.business_name} />
        <F name="tagline" label="Tagline" value={s.tagline} />
        <ImagePicker label="Logo" url={logo} onChange={setLogo} />
        <T name="store_description" label="About your store (shown on the About page)" value={s.store_description} />
      </Section>

      <Section title="Contact" hint="Enter 10-digit mobile numbers without +91.">
        <F name="phone_primary" label="Phone number 1" value={s.phone_primary} type="tel" />
        <F name="phone_secondary" label="Phone number 2" value={s.phone_secondary} type="tel" />
        <F name="whatsapp_number" label="WhatsApp number" value={s.whatsapp_number} type="tel" help="Used for all “Chat on WhatsApp” buttons." />
        <F name="email" label="Email" value={s.email} type="email" />
      </Section>

      <Section title="Store location">
        <F name="maps_url" label="Google Maps link" value={s.maps_url} wide />
        <T name="store_address" label="Shop address (optional)" value={s.store_address} rows={2} placeholder="Leave empty to show only the map button" />
        <T name="store_hours" label="Opening hours (optional)" value={s.store_hours} rows={2} placeholder="e.g. Mon–Sat 10 am – 8 pm, Sunday closed" />
      </Section>

      <Section title="Social links">
        <F name="instagram_url" label="Instagram page link" value={s.instagram_url} />
        <F name="facebook_url" label="Facebook page link" value={s.facebook_url} />
        <F name="youtube_url" label="YouTube link" value={s.youtube_url} />
      </Section>

      <Section title="Payments & delivery">
        <div className="sm:col-span-2 rounded-lg bg-ivory p-4 text-sm">
          <strong>Online card/UPI payment (Razorpay): </strong>
          {razorpay === "live" ? "LIVE — real payments are being accepted." : razorpay === "test" ? "TEST mode — no real money moves. Switch to live keys before launch." : "Not connected — customers cannot pay online by card yet."}
        </div>
        <label className="flex items-center gap-3 rounded-lg border border-ink/10 p-3"><input type="checkbox" name="cod_enabled" defaultChecked={s.cod_enabled} className="h-5 w-5 accent-wine" />Allow Cash on Delivery</label>
        <label className="flex items-center gap-3 rounded-lg border border-ink/10 p-3"><input type="checkbox" name="upi_enabled" defaultChecked={s.upi_enabled} className="h-5 w-5 accent-wine" />Allow UPI QR payment</label>
        <F name="upi_id" label="UPI ID" value={s.upi_id} placeholder="name@bank" />
        <F name="upi_payee_name" label="Name on UPI" value={s.upi_payee_name} />
        <ImagePicker label="UPI QR code image" url={qr} onChange={setQr} />
        <div />
        <F name="shipping_fee" label="Delivery charge (₹)" value={s.shipping_fee} type="number" />
        <F name="free_shipping_above" label="Free delivery above (₹)" value={s.free_shipping_above} type="number" help="Leave empty for no free delivery." />
        <F name="low_stock_threshold" label="Warn me when stock is at or below" value={s.low_stock_threshold} type="number" />
      </Section>

      <Section title="Policies" hint="Write your real policies here. Customers see them on the Policies page and at checkout. Until you fill these in, the website says the policy is available on request.">
        <T name="return_policy" label="Return & exchange policy" value={s.return_policy} rows={6} />
        <T name="shipping_policy" label="Shipping & delivery policy" value={s.shipping_policy} rows={6} />
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/95 px-4 py-3 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-5xl justify-end">
          <button className="btn-primary px-10 py-3.5 text-base" disabled={pending}>{pending ? "Saving…" : "Save settings"}</button>
        </div>
      </div>
    </form>
  );
}
