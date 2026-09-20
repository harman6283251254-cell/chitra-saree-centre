"use client";
import { useState, useTransition } from "react";
import { sendWhatsAppTest } from "@/app/admin/actions";

export default function WhatsAppTest() {
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="mt-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await sendWhatsAppTest(phone); setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error }); }); }}>
      <div className="flex gap-2">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="Your mobile number" className="field" aria-label="Mobile number for test" />
        <button className="btn-wa shrink-0" disabled={pending}>{pending ? "Sending…" : "Send test"}</button>
      </div>
      {msg && <p role="status" className={`mt-2 text-sm ${msg.ok ? "text-[#1F7A45]" : "text-wine"}`}>{msg.text}</p>}
    </form>
  );
}
