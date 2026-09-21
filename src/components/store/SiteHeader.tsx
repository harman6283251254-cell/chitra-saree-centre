"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { useCart } from "./CartProvider";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader({ phone, whatsappHref, categories, signedIn }: {
  phone: string | null; whatsappHref: string; categories: { name: string; slug: string }[]; signedIn: boolean;
}) {
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => { setOpen(false); setSearchOpen(false); }, [pathname]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zari/25 bg-ivory/95 backdrop-blur">
      <div className="hidden bg-wine text-ivory/90 md:block">
        <div className="page flex h-9 items-center justify-between text-[13px]">
          <span>Worldwide Shipping — order online from anywhere</span>
          <div className="flex items-center gap-5">
            {phone && <a href={`tel:+91${phone}`} className="hover:text-white">Call {phone}</a>}
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp us</a>
            <Link href="/track-order" className="hover:text-white">Track order</Link>
          </div>
        </div>
      </div>

      <div className="page flex h-16 items-center gap-3 md:h-20">
        <button className="-ml-2 p-2 text-wine md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Icon name="menu" className="h-6 w-6" />
        </button>
        <Link href="/" className="flex items-center gap-2.5" aria-label="Chitra Saree Centre home">
          <Image src="/logo-sm.jpg" alt="" width={44} height={44} className="h-10 w-10 rounded-full md:h-11 md:w-11" priority />
          <span className="leading-none">
            <span className="block font-display text-[26px] font-semibold text-wine md:text-[30px]">Chitra</span>
            <span className="block text-[10.5px] tracking-[0.28em] text-zari">SAREE CENTRE</span>
          </span>
        </Link>

        <nav className="ml-8 hidden items-center gap-7 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className={`text-[15px] transition-colors hover:text-wine ${pathname === n.href ? "text-wine" : "text-ink-soft"}`}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button className="p-2 text-wine" aria-label="Search" onClick={() => setSearchOpen((s) => !s)}>
            <Icon name="search" className="h-[22px] w-[22px]" />
          </button>
          <Link href={signedIn ? "/account" : "/login"} className="hidden items-center gap-1.5 p-2 text-wine sm:flex" aria-label={signedIn ? "My Account" : "Sign in"}>
            <Icon name="user" className="h-[22px] w-[22px]" />
            <span className="hidden text-sm md:inline">{signedIn ? "My Account" : "Sign In"}</span>
          </Link>
          <Link href={signedIn ? "/account" : "/login"} className="p-2 text-wine sm:hidden" aria-label={signedIn ? "My Account" : "Sign in"}>
            <Icon name="user" className="h-[22px] w-[22px]" />
          </Link>
          <Link href="/cart" className="relative p-2 text-wine" aria-label={`Cart, ${count} items`}>
            <Icon name="bag" className="h-[22px] w-[22px]" />
            {ready && count > 0 && (
              <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-zari px-1 text-[11px] font-medium text-white">{count}</span>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <form onSubmit={submit} className="page pb-4" role="search">
          <div className="flex gap-2">
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} className="field" type="search"
              placeholder="Search sarees, banarasi, lehenga, silk, gota patti…" aria-label="Search products" maxLength={80} />
            <button className="btn-primary px-5" type="submit">Search</button>
          </div>
        </form>
      )}

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[84%] max-w-sm flex-col overflow-y-auto bg-ivory">
            <div className="flex items-center justify-between border-b border-zari/25 px-5 py-4">
              <span className="font-display text-2xl text-wine">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2 text-wine"><Icon name="close" /></button>
            </div>
            <nav className="flex flex-col px-5 py-3" aria-label="Mobile">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="border-b border-ink/5 py-3.5 text-lg text-ink">{n.label}</Link>
              ))}
              <Link href="/track-order" className="border-b border-ink/5 py-3.5 text-lg text-ink">Track your order</Link>
              <Link href={signedIn ? "/account" : "/login"} className="border-b border-ink/5 py-3.5 text-lg text-ink">{signedIn ? "My Account" : "Sign In / Sign Up"}</Link>
            </nav>
            <div className="px-5 pb-2 pt-4 text-sm text-ink-mute">Shop by category</div>
            <div className="flex flex-wrap gap-2 px-5">
              {categories.map((c) => (
                <Link key={c.slug} href={`/category/${c.slug}`} className="rounded-full border border-wine/20 px-3.5 py-1.5 text-sm text-wine">{c.name}</Link>
              ))}
            </div>
            <div className="mt-auto grid grid-cols-2 gap-3 p-5">
              {phone && <a href={`tel:+91${phone}`} className="btn-outline px-3"><Icon name="phone" className="h-4 w-4" />Call</a>}
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-wa px-3">WhatsApp</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
