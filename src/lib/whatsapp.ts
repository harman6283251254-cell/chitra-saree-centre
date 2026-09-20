import { intlPhone } from "@/lib/format";

/** Click-to-chat link (works without any API setup). */
export function whatsappLink(number: string | null | undefined, message?: string) {
  const n = intlPhone(number);
  return `https://wa.me/${n}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
