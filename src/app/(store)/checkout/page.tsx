"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/store/CartProvider";
import { shippingFor, useCartQuote } from "@/components/store/useCartQuote";
import { payWithRazorpay } from "@/components/store/razorpay-client";
import ProductImage from "@/components/store/ProductImage";
import Icon from "@/components/Icon";
import { formatINR } from "@/lib/format";
import { INDIAN_STATES } from "@/lib/india";
import { COUNTRIES } from "@/lib/countries";

type Method = "cod" | "upi" | "razorpay";

export default function CheckoutPage() {
  const { items, subtotal, ready, clear } = useCart();
  const { quote, changed } = useCartQuote();
  const router = useRouter();
  const [method, setMethod] = useState<Method | "">("");
  const [country, setCountry] = useState("India");
  const isIndia = country === "India";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const shipping = shippingFor(subtotal, quote);

  if (!ready) return <div className="page py-20 text-ink-mute">Loading…</div>;
  if (!items.length) {
    return (
      <div className="page py-20 text-center">
        <h1 className="font-display text-4xl">Your cart is empty</h1>
        <Link href="/shop" className="btn-primary mt-8">Continue shopping</Link>
      </div>
    );
  }

  const options: { id: Method; title: string; note: string; show: boolean; badge?: string }[] = [
    { id: "razorpay", title: "Pay online", note: "UPI, cards, net banking or wallets through Razorpay's secure page.", show: quote?.payments.razorpay !== "off", badge: quote?.payments.razorpay === "test" ? "Test mode" : undefined },
    { id: "upi", title: "Pay by UPI QR / UPI app", note: "Scan our QR or pay from any UPI app after placing the order. We confirm once we see the payment.", show: !!quote?.payments.upi },
    { id: "cod", title: "Cash on delivery", note: "Pay in cash when your order arrives.", show: !!quote?.payments.cod },
  ];
  const available = options.filter((o) => o.show);
  const chosen: Method | "" = method || available[0]?.id || "";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!chosen) return setError("Please choose a payment option.");
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name"), country, phone: fd.get("phone"), email: fd.get("email") ?? "", address: fd.get("address"),
      city: fd.get("city"), state: fd.get("state"), pincode: fd.get("pincode"), notes: fd.get("notes") ?? "",
      payment_method: chosen, items: items.map((i) => ({ product_id: i.id, quantity: i.qty })),
    };
    setBusy(true);
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Something went wrong");
      clear();
      if (chosen === "razorpay") {
        try {
          await payWithRazorpay(d.token, () => router.push(`/order/${d.token}`));
        } catch {
          router.push(`/order/${d.token}`);
        }
      } else {
        router.push(`/order/${d.token}`);
      }
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="page pt-10">
      <h1 className="font-display text-4xl sm:text-5xl">Checkout</h1>
      {changed.length > 0 && (
        <div className="mt-5 rounded-lg border border-zari/50 bg-zari-pale/50 px-4 py-3 text-sm" role="status">{changed.map((c) => <p key={c}>{c}</p>)}</div>
      )}
      <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]" noValidate={false}>
        <div className="space-y-10">
          <fieldset>
            <legend className="font-display text-2xl text-wine-deep">Delivery details</legend>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="label" htmlFor="name">Full name</label><input id="name" name="name" required maxLength={80} autoComplete="name" className="field" /></div>
              <div><label className="label" htmlFor="country">Country</label>
                <select id="country" name="country" required className="field" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name">
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="label" htmlFor="phone">{isIndia ? "Mobile number" : "Phone number"}</label>
                {isIndia
                  ? <input id="phone" name="phone" required inputMode="numeric" pattern="(\+?91)?[6-9][0-9]{9}" title="10-digit mobile number" maxLength={13} autoComplete="tel" className="field" placeholder="10-digit number" />
                  : <input id="phone" name="phone" required inputMode="tel" maxLength={20} autoComplete="tel" className="field" placeholder="Include country code, e.g. +1 555 123 4567" />}
              </div>
              <div><label className="label" htmlFor="email">Email <span className="text-ink-mute">(optional)</span></label><input id="email" name="email" type="email" maxLength={120} autoComplete="email" className="field" /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="address">Address</label><textarea id="address" name="address" required rows={2} maxLength={300} autoComplete="street-address" className="field" placeholder="House no., street, area, landmark" /></div>
              <div><label className="label" htmlFor="city">City</label><input id="city" name="city" required maxLength={60} autoComplete="address-level2" className="field" /></div>
              <div><label className="label" htmlFor="state">{isIndia ? "State" : "State / Province / Region"}</label>
                {isIndia
                  ? <select id="state" name="state" required className="field" defaultValue="Punjab">
                      {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  : <input id="state" name="state" required maxLength={60} autoComplete="address-level1" className="field" placeholder="State / Province / Region" />}
              </div>
              <div><label className="label" htmlFor="pincode">{isIndia ? "Pincode" : "Postal / ZIP code"}</label>
                {isIndia
                  ? <input id="pincode" name="pincode" required inputMode="numeric" pattern="[1-9][0-9]{5}" title="6-digit pincode" maxLength={6} autoComplete="postal-code" className="field" />
                  : <input id="pincode" name="pincode" required maxLength={20} autoComplete="postal-code" className="field" placeholder="Postal / ZIP code" />}
              </div>
              <div className="sm:col-span-2"><label className="label" htmlFor="notes">Note for us <span className="text-ink-mute">(optional)</span></label><input id="notes" name="notes" maxLength={300} className="field" placeholder="e.g. blouse size, preferred delivery time" /></div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-display text-2xl text-wine-deep">Payment</legend>
            {!quote ? <p className="mt-4 text-ink-mute">Loading payment options…</p> : available.length === 0 ? (
              <p className="mt-4 text-ink-soft">Online ordering is paused right now. Please call or WhatsApp us to order.</p>
            ) : (
              <div className="mt-5 space-y-3">
                {available.map((o) => (
                  <label key={o.id} className={`flex cursor-pointer gap-3 rounded-xl border bg-white p-4 transition-colors ${chosen === o.id ? "border-wine ring-1 ring-wine" : "border-ink/15"}`}>
                    <input type="radio" name="payment" value={o.id} checked={chosen === o.id} onChange={() => setMethod(o.id)} className="mt-1 h-4 w-4 accent-wine" />
                    <span>
                      <span className="flex items-center gap-2 text-ink">{o.title}{o.badge && <span className="rounded bg-zari-pale px-2 py-0.5 text-xs text-ink">{o.badge}</span>}</span>
                      <span className="mt-0.5 block text-sm text-ink-soft">{o.note}</span>
                    </span>
                  </label>
                ))}
                {quote.payments.razorpay === "test" && chosen === "razorpay" && (
                  <p className="text-sm text-[#A0561A]">Test mode: no real money is charged. The shop owner is still setting up live payments.</p>
                )}
              </div>
            )}
          </fieldset>
        </div>

        <aside className="h-fit rounded-2xl border border-zari/30 bg-white p-6 lg:sticky lg:top-28">
          <h2 className="text-2xl">Your order</h2>
          <ul className="mt-5 space-y-4">
            {items.map((it) => (
              <li key={it.id} className="flex gap-3">
                <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded bg-ivory-deep"><ProductImage src={it.image} alt="" sizes="56px" /></div>
                <div className="min-w-0 flex-1 text-sm"><p className="line-clamp-2 text-ink">{it.name}</p><p className="text-ink-mute">Qty {it.qty} × {formatINR(it.price)}</p></div>
                <span className="text-sm">{formatINR(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-ink/10 pt-4 text-[15px]">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Delivery</dt><dd>{shipping ? formatINR(shipping) : "Free"}</dd></div>
            <div className="flex justify-between border-t border-ink/10 pt-3 text-lg"><dt>Total</dt><dd className="font-medium text-wine">{formatINR(subtotal + shipping)}</dd></div>
          </dl>
          {error && <p className="mt-4 rounded-lg bg-wine/10 px-3 py-2 text-sm text-wine" role="alert">{error}</p>}
          <button type="submit" disabled={busy || !chosen} className="btn-primary mt-5 w-full">
            {busy ? "Placing order…" : chosen === "razorpay" ? `Pay ${formatINR(subtotal + shipping)}` : "Place order"}
          </button>
          <p className="mt-4 flex gap-2 text-xs leading-relaxed text-ink-mute"><Icon name="shield" className="h-4 w-4 shrink-0" />Your details are only used to deliver this order. We never ask for or store card numbers, CVV, UPI PIN or bank passwords.</p>
          <p className="mt-2 text-xs text-ink-mute">The final price is confirmed by our system when you place the order.</p>
        </aside>
      </form>
    </div>
  );
}
