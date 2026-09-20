"use client";

declare global {
  interface Window { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void } }
}

function loadScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/** Opens Razorpay's secure payment window. Card/UPI details are entered on Razorpay, never on our site. */
export async function payWithRazorpay(token: string, onDone: (paid: boolean) => void) {
  if (!(await loadScript()) || !window.Razorpay) throw new Error("Could not load the payment window. Check your internet and try again.");
  const res = await fetch("/api/payments/razorpay/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error ?? "Could not start payment");
  const rz = new window.Razorpay({
    key: d.key, order_id: d.orderId, amount: d.amount, currency: d.currency, name: d.name, description: d.description,
    prefill: d.prefill, theme: { color: "#5C0F2B" },
    handler: async (resp: Record<string, string>) => {
      const v = await fetch("/api/payments/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resp) });
      onDone(v.ok);
    },
    modal: { ondismiss: () => onDone(false) },
  });
  rz.on("payment.failed", () => { /* Razorpay shows the error; customer can retry inside the window */ });
  rz.open();
}
