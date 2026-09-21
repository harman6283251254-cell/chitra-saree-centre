"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import Icon from "@/components/Icon";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn-outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createBrowserSupabase().auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      <Icon name="logout" className="h-4 w-4" />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
