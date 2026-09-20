"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TrackOrderPage() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="page max-w-lg pt-12">
      <h1 className="font-display text-4xl sm:text-5xl">Track your order</h1>
      <p className="mt-3 text-ink-soft">Enter the order ID you received (for example CSC-1001) and the mobile number used for the order.</p>
      <form className="mt-8 space-y-4" onSubmit={async (e) => {
        e.preventDefault(); setErr(""); setBusy(true);
        const fd = new FormData(e.currentTarget);
        const r = await fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber: fd.get("order"), phone: fd.get("phone") }) });
        const d = await r.json().catch(() => ({}));
        if (r.ok) router.push(`/order/${d.token}`); else { setErr(d.error ?? "Not found"); setBusy(false); }
      }}>
        <div><label className="label" htmlFor="order">Order ID</label><input id="order" name="order" required className="field uppercase" placeholder="CSC-1001" maxLength={20} /></div>
        <div><label className="label" htmlFor="phone">Mobile number</label><input id="phone" name="phone" required inputMode="numeric" className="field" maxLength={13} /></div>
        {err && <p className="text-sm text-wine" role="alert">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Checking…" : "Track order"}</button>
      </form>
    </div>
  );
}
