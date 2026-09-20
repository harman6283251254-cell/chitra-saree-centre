"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { payWithRazorpay } from "./razorpay-client";

export function RazorpayRetry({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div>
      <button className="btn-primary" disabled={busy} onClick={async () => {
        setBusy(true); setErr("");
        try { await payWithRazorpay(token, () => { setBusy(false); router.refresh(); }); }
        catch (e) { setErr((e as Error).message); setBusy(false); }
      }}>{busy ? "Opening payment…" : "Pay now"}</button>
      {err && <p className="mt-2 text-sm text-wine" role="alert">{err}</p>}
    </div>
  );
}

export function UpiReferenceForm({ token, existing }: { token: string; existing: string | null }) {
  const [ref, setRef] = useState(existing ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(existing ? { ok: true, text: "Reference received. We will confirm your payment shortly." } : null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="mt-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setMsg(null);
      const r = await fetch("/api/orders/upi-reference", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, reference: ref }) });
      const d = await r.json().catch(() => ({}));
      setMsg(r.ok ? { ok: true, text: "Reference received. We will confirm your payment shortly." } : { ok: false, text: d.error ?? "Could not save" });
      setBusy(false);
    }}>
      <label className="label" htmlFor="upi-ref">After paying, enter the UPI reference / UTR number (optional, helps us find your payment faster)</label>
      <div className="flex gap-2">
        <input id="upi-ref" value={ref} onChange={(e) => setRef(e.target.value.replace(/\s/g, ""))} maxLength={30} inputMode="numeric" className="field" placeholder="e.g. 412345678901" />
        <button className="btn-outline shrink-0 px-5" disabled={busy || ref.length < 6}>Send</button>
      </div>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-[#1F7A45]" : "text-wine"}`} role="status">{msg.text}</p>}
    </form>
  );
}
