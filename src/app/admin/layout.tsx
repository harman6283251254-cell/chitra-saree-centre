import type { Metadata } from "next";
export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin — Chitra Saree Centre" }, robots: { index: false, follow: false } };
export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#F7F2EE]">{children}</div>;
}
