"use client";
import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/Icon";

export default function FloatingWhatsApp({ href }: { href: string }) {
  const path = usePathname();
  if (path.startsWith("/product/") || path === "/checkout" || path === "/cart") return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#1F8F4E] text-white shadow-lg shadow-ink/20 transition-transform hover:scale-105">
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
