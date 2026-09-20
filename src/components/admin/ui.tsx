import Link from "next/link";
import type { OrderStatus, PaymentStatus } from "@/lib/types";
import { statusLabel } from "@/lib/format";

export function PageTitle({ title, action, back }: { title: string; action?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-7">
      {back && <Link href={back.href} className="mb-3 inline-block text-sm text-ink-mute hover:text-wine">← {back.label}</Link>}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl">{title}</h1>
        {action}
      </div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-ink/10 bg-white p-5 sm:p-6 ${className}`}>{children}</div>;
}

const ORDER_COLORS: Record<string, string> = {
  pending: "bg-zari-pale text-[#7A5518]", confirmed: "bg-[#E6EEF8] text-[#1E4C80]", processing: "bg-[#EEE8F7] text-[#4E3585]",
  shipped: "bg-[#E4F1F1] text-[#1C6060]", delivered: "bg-[#E4F3EA] text-[#1F7A45]", cancelled: "bg-ink/10 text-ink-soft",
};
const PAY_COLORS: Record<string, string> = {
  pending: "bg-zari-pale text-[#7A5518]", awaiting_verification: "bg-[#FCE9DC] text-[#A0561A]", paid: "bg-[#E4F3EA] text-[#1F7A45]",
  failed: "bg-wine/10 text-wine", refunded: "bg-ink/10 text-ink-soft",
};
export function OrderBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] ${ORDER_COLORS[status]}`}>{statusLabel(status)}</span>;
}
export function PayBadge({ status }: { status: PaymentStatus }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] ${PAY_COLORS[status]}`}>{status === "awaiting_verification" ? "Check UPI payment" : statusLabel(status)}</span>;
}
export function StockBadge({ state, stock }: { state: "in" | "low" | "out"; stock: number }) {
  const c = state === "out" ? "bg-wine/10 text-wine" : state === "low" ? "bg-[#FCE9DC] text-[#A0561A]" : "bg-[#E4F3EA] text-[#1F7A45]";
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] ${c}`}>{state === "out" ? "Out of stock" : state === "low" ? `Low stock (${stock})` : `In stock (${stock})`}</span>;
}
