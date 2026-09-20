import type { Product, ProductImage } from "./types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatINR = (n: number | string) => inr.format(Number(n));

export function discountPercent(price: number, mrp: number) {
  const p = Number(price), m = Number(mrp);
  if (!m || p >= m) return 0;
  return Math.round(((m - p) / m) * 100);
}

export type StockState = "in" | "low" | "out";
export function stockState(p: Pick<Product, "stock" | "is_available">, lowAt = 3): StockState {
  if (!p.is_available || p.stock <= 0) return "out";
  if (p.stock <= lowAt) return "low";
  return "in";
}
export const stockLabel: Record<StockState, string> = { in: "In stock", low: "Low stock", out: "Out of stock" };

export function mainImage(images: ProductImage[] | undefined): string | null {
  if (!images?.length) return null;
  const sorted = [...images].sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order);
  return sorted[0].url;
}
export function sortedImages(images: ProductImage[] | undefined) {
  return [...(images ?? [])].sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order);
}

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export const digitsOnly = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");
/** Indian mobile number for wa.me / tel: links, e.g. "6283251254" -> "916283251254" */
export function intlPhone(s: string | null | undefined) {
  const d = digitsOnly(s);
  if (d.length === 10) return "91" + d;
  return d;
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export const statusLabel = (s: string) =>
  s === "awaiting_verification" ? "Awaiting check" : s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");

export const paymentMethodLabel = (m: string) =>
  m === "cod" ? "Cash on delivery" : m === "upi" ? "UPI (QR / app)" : "Online (Razorpay)";
