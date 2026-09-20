"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function AdminLogin() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zari/30 bg-white p-8">
        <Image src="/logo-sm.jpg" alt="" width={64} height={64} className="mx-auto rounded-full" />
        <h1 className="mt-4 text-center text-3xl">Admin login</h1>
        <p className="mt-1 text-center text-sm text-ink-mute">Chitra Saree Centre</p>
        <form className="mt-8 space-y-4" onSubmit={async (e) => {
          e.preventDefault(); setErr(""); setBusy(true);
          const fd = new FormData(e.currentTarget);
          const sb = createBrowserSupabase();
          const { error } = await sb.auth.signInWithPassword({ email: String(fd.get("email")), password: String(fd.get("password")) });
          if (error) { setErr("Wrong email or password."); setBusy(false); return; }
          const { data: { user } } = await sb.auth.getUser();
          const { data: admin } = await sb.from("admin_users").select("user_id").eq("user_id", user!.id).maybeSingle();
          if (!admin) { await sb.auth.signOut(); setErr("This account is not an admin."); setBusy(false); return; }
          router.replace("/admin"); router.refresh();
        }}>
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="username" className="field" /></div>
          <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" className="field" /></div>
          {err && <p className="text-sm text-wine" role="alert">{err}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
        </form>
      </div>
    </div>
  );
}
