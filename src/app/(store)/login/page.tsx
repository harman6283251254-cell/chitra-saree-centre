"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "forgot";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    const sb = createBrowserSupabase();
    try {
      if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(params.get("next") || "/account");
        router.refresh();
      } else if (mode === "signup") {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          router.push(params.get("next") || "/account");
          router.refresh();
        } else {
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setNotice("If that email has an account, a reset link is on its way.");
      }
    } catch (err) {
      setError((err as Error).message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page flex min-h-[70vh] max-w-md flex-col justify-center py-16">
      <h1 className="font-display text-4xl text-wine-deep">
        {mode === "signin" ? "Sign in" : mode === "signup" ? "Create your account" : "Reset your password"}
      </h1>
      <p className="mt-2 text-ink-soft">
        {mode === "forgot" ? "We'll email you a link to set a new password." : "to track orders and check out faster next time."}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email" maxLength={120} className="field"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {mode !== "forgot" && (
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" required minLength={6} maxLength={72}
              autoComplete={mode === "signup" ? "new-password" : "current-password"} className="field"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        )}
        {error && <p className="rounded-lg bg-wine/10 px-3 py-2 text-sm text-wine" role="alert">{error}</p>}
        {notice && <p className="rounded-lg bg-zari-pale/60 px-3 py-2 text-sm text-ink" role="status">{notice}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
        </button>
      </form>

      <div className="mt-6 space-y-2 text-sm text-ink-soft">
        {mode === "signin" && (
          <>
            <p><button className="text-wine underline" onClick={() => { setMode("signup"); setError(""); setNotice(""); }}>New here? Create an account</button></p>
            <p><button className="text-wine underline" onClick={() => { setMode("forgot"); setError(""); setNotice(""); }}>Forgot your password?</button></p>
          </>
        )}
        {mode === "signup" && (
          <p><button className="text-wine underline" onClick={() => { setMode("signin"); setError(""); setNotice(""); }}>Already have an account? Sign in</button></p>
        )}
        {mode === "forgot" && (
          <p><button className="text-wine underline" onClick={() => { setMode("signin"); setError(""); setNotice(""); }}>Back to sign in</button></p>
        )}
        <p><Link href="/" className="text-ink-mute hover:text-wine">Continue as guest instead</Link></p>
      </div>
    </div>
  );
}
