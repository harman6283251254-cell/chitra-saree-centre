"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setBusy(true);
    const sb = createBrowserSupabase();
    const { error } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message || "Could not update password. The link may have expired.");
    setDone(true);
    setTimeout(() => router.push("/account"), 1500);
  }

  return (
    <div className="page flex min-h-[70vh] max-w-md flex-col justify-center py-16">
      <h1 className="font-display text-4xl text-wine-deep">Set a new password</h1>
      {done ? (
        <p className="mt-6 rounded-lg bg-zari-pale/60 px-3 py-2 text-sm text-ink" role="status">Password updated — taking you to your account…</p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="password">New password</label>
            <input id="password" type="password" required minLength={6} maxLength={72} autoComplete="new-password"
              className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="rounded-lg bg-wine/10 px-3 py-2 text-sm text-wine" role="alert">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? "Saving…" : "Save new password"}</button>
        </form>
      )}
    </div>
  );
}
