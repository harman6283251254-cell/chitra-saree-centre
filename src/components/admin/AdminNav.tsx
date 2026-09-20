"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import { signOut } from "@/app/admin/actions";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/products", label: "Products", icon: "box" },
  { href: "/admin/orders", label: "Orders", icon: "receipt" },
  { href: "/admin/categories", label: "Categories", icon: "tag" },
  { href: "/admin/customers", label: "Customers", icon: "users" },
  { href: "/admin/social", label: "Social media", icon: "share" },
  { href: "/admin/settings", label: "Settings", icon: "cog" },
];

export default function AdminNav({ pendingOrders }: { pendingOrders: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/admin" ? path === "/admin" : path.startsWith(h));
  const list = (
    <nav className="flex flex-col gap-1 p-3" aria-label="Admin">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3.5 py-3 text-[15px] ${active(l.href) ? "bg-ivory/15 text-white" : "text-ivory/75 hover:bg-ivory/10 hover:text-white"}`}>
          <Icon name={l.icon} className="h-5 w-5" />{l.label}
          {l.href === "/admin/orders" && pendingOrders > 0 && <span className="ml-auto rounded-full bg-zari px-2 text-xs text-white">{pendingOrders}</span>}
        </Link>
      ))}
      <a href="/" target="_blank" className="mt-4 flex items-center gap-3 rounded-lg px-3.5 py-3 text-[15px] text-ivory/75 hover:bg-ivory/10"><Icon name="eye" className="h-5 w-5" />View website</a>
      <form action={signOut}><button className="flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-[15px] text-ivory/75 hover:bg-ivory/10"><Icon name="logout" className="h-5 w-5" />Log out</button></form>
    </nav>
  );
  const brand = (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <Image src="/logo-sm.jpg" alt="" width={38} height={38} className="rounded-full" />
      <div className="leading-tight"><div className="font-display text-xl text-ivory">Chitra</div><div className="text-[11px] text-zari-light">Admin</div></div>
    </div>
  );
  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-wine-deep lg:flex">{brand}{list}</aside>
      <div className="sticky top-0 z-40 flex items-center justify-between bg-wine-deep px-3 lg:hidden">
        {brand}
        <button onClick={() => setOpen(true)} className="p-3 text-ivory" aria-label="Open menu"><Icon name="menu" className="h-6 w-6" /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-72 overflow-y-auto bg-wine-deep">
            <div className="flex justify-end p-2"><button onClick={() => setOpen(false)} className="p-3 text-ivory" aria-label="Close menu"><Icon name="close" /></button></div>
            {list}
          </div>
        </div>
      )}
    </>
  );
}
