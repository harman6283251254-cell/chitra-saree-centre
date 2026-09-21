import { CartProvider } from "@/components/store/CartProvider";
import SiteHeader from "@/components/store/SiteHeader";
import SiteFooter from "@/components/store/SiteFooter";
import FloatingWhatsApp from "@/components/store/FloatingWhatsApp";
import { getCategories, getSettings } from "@/lib/data";
import { whatsappLink } from "@/lib/whatsapp";
import { getCustomer } from "@/lib/customer-auth";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [s, categories, customer] = await Promise.all([getSettings(), getCategories(), getCustomer()]);
  const wa = whatsappLink(s.whatsapp_number, `Hi ${s.business_name}, I have a question.`);
  return (
    <CartProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <SiteHeader phone={s.phone_primary} whatsappHref={wa} categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} signedIn={Boolean(customer)} />
      <main id="main" className="min-h-[60vh]">{children}</main>
      <SiteFooter s={s} categories={categories} />
      <FloatingWhatsApp href={wa} />
    </CartProvider>
  );
}
