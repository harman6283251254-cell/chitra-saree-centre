import type { Metadata } from "next";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Returns, refunds & shipping" };

export default async function PoliciesPage() {
  const s = await getSettings();
  const block = (title: string, text: string | null) => (
    <section className="mt-10">
      <h2 className="text-3xl">{title}</h2>
      {text ? <div className="mt-3 space-y-3 leading-relaxed text-ink-soft">{text.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
        : <p className="mt-3 text-ink-soft">This policy is being updated. Please call or WhatsApp us at +91 {s.whatsapp_number} before placing your order if you have any questions.</p>}
    </section>
  );
  return (
    <div className="page max-w-3xl pt-12">
      <h1 className="font-display text-5xl">Returns, refunds & shipping</h1>
      {block("Returns & refunds", s.return_policy)}
      {block("Shipping & delivery", s.shipping_policy)}
      <section className="mt-10">
        <h2 className="text-3xl">Payments & your privacy</h2>
        <p className="mt-3 leading-relaxed text-ink-soft">Online payments are handled by Razorpay on their secure page. We never ask for, see or store your card number, CVV, UPI PIN or bank password. Your name, phone and address are used only to deliver your order and contact you about it.</p>
      </section>
    </div>
  );
}
