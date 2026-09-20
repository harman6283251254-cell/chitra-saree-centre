"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateOrderStatus, updatePaymentStatus } from "@/app/admin/actions";
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from "@/lib/types";
import { statusLabel } from "@/lib/format";

export default function OrderControls({ id, orderStatus, paymentStatus, whatsappLive }: { id: string; orderStatus: OrderStatus; paymentStatus: PaymentStatus; whatsappLive: boolean }) {
  const router = useRouter();
  const [os, setOs] = useState<string>(orderStatus);
  const [ps, setPs] = useState<string>(paymentStatus);
  const [notify, setNotify] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const locked = orderStatus === "cancelled";

  function saveStatus() {
    if (os === orderStatus) return;
    if (os === "cancelled" && !confirm("Cancel this order? Stock will be added back. A cancelled order cannot be reopened.")) return;
    start(async () => {
      const r = await updateOrderStatus(id, os, notify);
      setMsg(r.ok ? { ok: true, text: `Order marked as ${statusLabel(os)}.${r.whatsapp ? " " + r.whatsapp : ""}` } : { ok: false, text: r.error });
      if (!r.ok) setOs(orderStatus);
      router.refresh();
    });
  }
  function savePay() {
    if (ps === paymentStatus) return;
    start(async () => {
      const r = await updatePaymentStatus(id, ps);
      setMsg(r.ok ? { ok: true, text: `Payment marked as ${statusLabel(ps)}.` } : { ok: false, text: r.error });
      router.refresh();
    });
  }

  return (
    <div className="mt-4 space-y-5">
      <div>
        <label className="label" htmlFor="os">Order status</label>
        <div className="flex gap-2">
          <select id="os" className="field" value={os} disabled={locked || pending} onChange={(e) => setOs(e.target.value)}>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
          <button className="btn-primary" disabled={locked || pending || os === orderStatus} onClick={saveStatus}>Save</button>
        </div>
        {!locked && (
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 accent-wine" />
            Send WhatsApp update to customer {!whatsappLive && <span className="text-ink-mute">(demo mode)</span>}
          </label>
        )}
        {locked && <p className="mt-2 text-sm text-ink-mute">This order is cancelled and cannot be changed.</p>}
      </div>
      <div>
        <label className="label" htmlFor="ps">Payment status</label>
        <div className="flex gap-2">
          <select id="ps" className="field" value={ps} disabled={pending} onChange={(e) => setPs(e.target.value)}>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s === "awaiting_verification" ? "Check UPI payment" : statusLabel(s)}</option>)}
          </select>
          <button className="btn-outline" disabled={pending || ps === paymentStatus} onClick={savePay}>Save</button>
        </div>
      </div>
      {msg && <p role="status" className={`rounded-lg p-3 text-sm ${msg.ok ? "bg-[#E4F3EA] text-[#1F7A45]" : "bg-wine/10 text-wine"}`}>{msg.text}</p>}
    </div>
  );
}
