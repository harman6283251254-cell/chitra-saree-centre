import "server-only";
import crypto from "crypto";

const KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";

export const razorpayConfigured = () => Boolean(KEY_ID && KEY_SECRET);
export const razorpayMode = (): "test" | "live" | "off" =>
  !razorpayConfigured() ? "off" : KEY_ID.startsWith("rzp_live_") ? "live" : "test";
export const razorpayPublicKey = () => KEY_ID; // key id is public by design; the secret never leaves the server

export async function createRazorpayOrder(amountRupees: number, receipt: string) {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64"),
    },
    body: JSON.stringify({ amount: Math.round(amountRupees * 100), currency: "INR", receipt }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed (${res.status})`);
  return (await res.json()) as { id: string; amount: number; currency: string };
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** Checkout signature: HMAC_SHA256(order_id|payment_id, key_secret) */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** Webhook signature: HMAC_SHA256(raw body, webhook_secret) */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
